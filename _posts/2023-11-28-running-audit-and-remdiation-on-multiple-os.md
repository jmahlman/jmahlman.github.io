---
title: 'Running audit and remediation on multiple OSes with mSCP and Jamf Pro'
date: '2023-11-28T09:00:00-05:00'
author: john
media_subpath: /assets/uploads/2023/11/mscp-post/
excerpt: "Sometime last year, I started working with the gang that created the <a href=\"https://github.com/usnistgov/macos_security\" target=\"_blank\" rel=\"noopener\">macOS Security Compliance project.</a> First, if you're not familiar with the project, head to the link above but I highly recommend <a href=\"https://it-training.apple.com/tutorials/deployment/sec005\" target=\"_blank\" rel=\"noopener\">Apple's excellent training</a> page that covers how to use the project. If you manage Macs at scale and have a need to secure them to specific standards (or want to start doing that) this is <b>the</b> project you need to know and learn. This blog will not be covering <i>how</i> to use the mSCP, what I want to share is how to implement your mSCP audit and remediation using Jamf when you have multiple operations systems in your environment as you should not be running the same script for all versions."
image: mscp_logo.png
categories: [Guides, MSCP]
tags: [apple, jamf, script]
---

Sometime last year, I started working with the gang that created the [macOS Security Compliance project](https://github.com/usnistgov/macos_security). First, if you're not familiar with the project, head to the link above but I highly recommend [Apple's excellent training](https://it-training.apple.com/tutorials/deployment/sec005) page that covers how to use the project. If you manage Macs at scale and have a need to secure them to specific standards (or want to start doing that) this is **the** project you need to know and learn. This blog will not be covering _how_ to use the mSCP, what I want to share is how to implement your mSCP audit and remediation using Jamf when you have multiple operations systems in your environment as you should not be running the same script for all versions.

## Getting Started

The only thing you need to have to set this up is a Jamf instance, mSCP scripts **for each OS** you want to manage, and highly recommend having a an extension attribute for showing the count of mSCP findings ([Jamf Compliance Editor](https://trusted.jamf.com/docs/establishing-compliance-baselines) will create one for you if you don't have one). The extension attribute will be used for the smart group for remediation policies so you're not running that every day. If you need the extension attribute; here it is, I have removed the Jamf header because it's too long (but know this is a Jamf script from JCE):

```bash
#!/bin/bash
######
# INSTRUCTIONS
# This Jamf Extension Attribute is used in conjunction with the macOS Security Compliance project (mSCP)
# https://github.com/usnistgov/macos_security
#
# Upload the following text into Jamf Pro Extension Attribute section.
#
# Used to gather the total number of failed results from the compliance audit.
######

audit=$(ls -l /Library/Preferences | /usr/bin/grep 'org.*.audit.plist' | /usr/bin/awk '{print $NF}')
EXEMPT_RULES=()
FAILED_RULES=()

if [[ ! -z "$audit" ]]; then

    count=$(echo "$audit" | /usr/bin/wc -l | /usr/bin/xargs)
    if [[ "$count" == 1 ]]; then
    
        # Get the Exemptions
        exemptfile="/Library/Managed Preferences/${audit}"
        if [[ ! -e "$exemptfile" ]];then
            exemptfile="/Library/Preferences/${audit}"
        fi

        rules=($(/usr/libexec/PlistBuddy -c "print :" "${exemptfile}" | /usr/bin/awk '/Dict/ { print $1 }'))
        
        for rule in ${rules[*]}; do
            if [[ $rule == "Dict" ]]; then
                continue
            fi
            EXEMPTIONS=$(/usr/libexec/PlistBuddy -c "print :$rule:exempt" "${exemptfile}" 2>/dev/null)
            if [[ "$EXEMPTIONS" == "true" ]]; then
                EXEMPT_RULES+=($rule)
            fi
        done
        
        unset $rules

        # Get the Findings
        auditfile="/Library/Preferences/${audit}"
        rules=($(/usr/libexec/PlistBuddy -c "print :" "${auditfile}" | /usr/bin/awk '/Dict/ { print $1 }'))
        
        for rule in ${rules[*]}; do
            if [[ $rule == "Dict" ]]; then
                continue
            fi
            FINDING=$(/usr/libexec/PlistBuddy -c "print :$rule:finding" "${auditfile}")
            if [[ "$FINDING" == "true" ]]; then
                FAILED_RULES+=($rule)
            fi
        done
        # count items only in Findings
        count=0
        for finding in ${FAILED_RULES[@]}; do
            if [[ ! " ${EXEMPT_RULES[*]} " =~ " ${finding} " ]] ;then
                ((count=count+1))
            fi
        done
    else
        count="-2"
    fi
else
    count="-1"
fi

/bin/echo "<result>${count}</result>"
```
{: file='compliance-FailedResultsCount.sh'}

Now, a little clarification on the compliance scripts; the mSCP is broken down into [branches](https://github.com/usnistgov/macos_security/branches/active) for each operating system. Like Apple does, only N-2 are active and updated (at the time of writing this; Sonoma, Ventura, and Monterey are supported). When you pull from the Git repository (or use Jamf Compliance Editor), you select the branch of the OS you want to build, generate the script, then move to the next OS branch. Once you have your OS scripts, upload them to Jamf and we'll continue to setup!

|![A script for each OS](Script List.png)|
|:--:|
|A script for each supported OS|

## Smart Groups

The first thing I would recommend is create your smart groups. You will need one for each OS you're supporting, and you'll need one for "MSCP Remediation Needed". That will look something like this (using the EA as named above):

| CRITERIA | OPERATOR | VALUE |
|--------------|:-----:|-----------:|
| compliance-FailedResultsCount | more than | 0 |

You'll also need separate OS smart groups; you can merge these if you desire but I find it much better to have a separate group for each OS anyway. An example for Sonoma would be:

| CRITERIA | OPERATOR | VALUE |
|--------------|:-----:|-----------:|
| Operating System Version | greater than or equal | 14 |
| Operating System Version | less than | 15 |

Once you have your smart groups setup, you can now create your policies!

## Policies

The way I have my policies set up is one policy for each operating system for auditing and one policy for each operating system for remediation. I also have one trigger policy for remediation. This allows me to ensure that systems are only running the scripts that are for the current operating system version.

> **Note**: In the past, this wasn't super important as compliance settings didn't change _too_ much between OS versions, and any items that were not applicable on the OS would just fail. With macOS Sonoma, [`auditd` is off by default](https://boberito.medium.com/auditd-the-logs-we-need-not-the-logs-we-deserve-cf1d8c83d15d) and if you run a Monterey baseline script against Sonoma (or if you ran a Ventura baseline before the updated rules were in place), and you are making changes to the `/etc/security/auditsecurity` file (which doesn't exist on fresh or upgraded Sonoma) you break the OS and will have a bad day. So please, don't do it.
{: .prompt-tip }

### Auditing

My audit policies are pretty simple; the policy will run the script for the OS with the flag `--check` as parameter 1, then update inventory.

|![Audit policies broken down into each OS](Audit Script Policies.png)|
|:--:|
|Audit policies broken down into each OS|

I run my audits every Monday, Wednesday, and Friday, but you can schedule them however you'd like. Suggested settings:

* Trigger: Recurring, **Custom**: `mscp-cis-audit`
* Execution Frequency: Once every day (this is up to you really)
* Scope: Your smart group covering the OS you are setting up, in my case that would be
  * Target: **Smart Group**: macOS 14 Sonoma

And that's really it for auditing!

### Remediation

My remediation policies are set up very much like the audit except that I added a extra trigger policy. You can technically do this with the auditing policies but in my environment the need wasn't there. I'll explain why we set it this way below.

|![Remediation policies broken down into each OS and trigger](mSCP Remediation List.png)|
|:--:|
|Remediation policies broken down into each OS and trigger|

The first policy, **Maintenance: MSCP CIS Remediation (Daily)**, is the trigger policy. The only thing this does is runs the command `jamf policy -event main-mscpFix`, then updates inventory after the trigger is complete. Here is how that policy is setup:

* Trigger: Recurring, **Custom**: `mscp-cis-fix`
* Execution Frequency: Once every day
* Scope:
  * Target: **Smart Group**: MSCP Remediation Needed (or whatever you named your smart group above)

The reason we have this policy is because we want it to update inventory only when the trigger policy is run, not every time the remediation is run. For example, we don't want a recon to queue when we're provisioning devices; this helps alleviate that. I can just run the remediation policy trigger (`main-mscpfix`) during provisioning and it won't run an unnecessary recon.

The next three policies are the separate OS policies, they are similar to the audit policies but we're **only** using the custom trigger we set above. Here's how the Sonoma policy is setup:

* Payload: **Scripts**: your MSCP script for Sonoma with the `--cfc` flag as parameter 1. (I also added the `--quiet=1` flag, you can ignore this unless you want to use it.)
* Trigger: **Custom**: `main-mscpfix`
* Execution Frequency: Ongoing
* Scope: Your smart group covering the OS you are setting up, in my case that would be 
  * Target: **Smart Group**: macOS 14 Sonoma

|![Remediation policy details](Sonoma Fix Script.png)|
|:--:|
|Remediation policy details|

## How it works

The process is pretty straight-forward; the device runs the audit policy once/day. If there is nothing found in the audit, the extension attribute will remain at `0` and will not fall into the remediation needed smart group. If an item is found, it falls into the smart group and the next check-in will run the remediation trigger policy. That trigger will run the OS specific remediation policy then run inventory to collect the updated audit results and if it goes well, it will fall out of the remediation needed smart group.

The benefit to this is that when a new OS comes out, you can simply add a new policy and scope it to that new OS, you don't have to mess with the other policies. This will also stop the remediation from running on OSes that you don't have a script for; this was especially important for Sonoma due to the `auditd` issue above.
