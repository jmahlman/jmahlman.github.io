---
title: Run Policies With Jamf Patch Management
date: 2023-12-22T10:30-05:00
author: john
media_subpath: /assets/uploads/2023/12/jamf-patch-post/
excerpt: |-
  Let's be honest, Jamf hasn't done a great job with it's patch management since it was released back in 2016 or so. Actually, patch management started as patch **reporting** which simply reported on versions installed. It was a bit later before they added the *management* part of it.  
  But this post isn't really about how patch could be so much better if Jamf actually put work into it (instead of just buying/bolting on other solutions), this is about making it a little more useful by letting it run policies instead of PKGs.
image: Patch-Screenshot.png
categories: [Guides]
tags: [apple, jamf]
---
Let's be honest, Jamf hasn't done a great job with it's patch management since it was released back in 2016 or so. Actually, patch management started as patch **reporting** which simply reported on versions installed. It was a bit later before they added the *management* part of it. But this post isn't really about how patch could be so much better if Jamf actually put work into it (instead of just buying/bolting on other solutions), this is about making it a little more useful by letting it run policies instead of PKGs.

Patch management is kind of a joke within the Mac Admins world, but alas...I actually use it. When I tell other admins that I use it for a good deal of software, I often get asked "Why?!" and "How?!" These are fair questions; patch management can **only** use [PKG files](https://ideas.jamf.com/ideas/JN-I-16682), you cannot [schedule patch times](https://ideas.jamf.com/ideas/JN-I-22463), and the user experience is leaves a lot to be desired. All of these have led to a good deal of alternate solutions for patching software across your fleet. Even after all of that, I still find some use with it, especially since I learned a quick hack to let it run policies and not just PKGs.

## A hacky solution

### Make a policy

Running a policy with a patch policy is quite simple actually, you just need to think outside of the patch!

First, make a policy that you want to run, in my case I'm going to use Wireshark. I'm using this because our policy has a script that runs after installation that adds some components after the fact. Set everything up how you would normally do it...but add a trigger, in my case I'm using "main-wireshark".

![A screenshot of my Wireshark policy that has a package and a script.](Wireshark Policy.png)
_Here's my policy, note that is has a package AND a script_

I bet you're thinking: *"But John, why don't you just make that a post install script in the PKG?"* Simple, I'm lazy! I don't want to have to re-create the Wireshark package every update, so I have it run via Jamf and just drop in the new package every version (or do I? *foreshadowing*).

### Make a package

After making your policy, now you want to make a package. This package is a payload-free package; its not installing anything, it's only running a script. You can use whatever method you want for making this package, I like using Rich Trouton's [Payload-Free-Package-Creator](https://github.com/rtrouton/Payload-Free-Package-Creator/). The script you're going to want to use is this:

```bash
#!/bin/zsh
ourPKGName="${1:t}"
parsedTriggerName=$(echo "${ourPKGName:t}" | /usr/bin/sed -E 's/RunTrigger-([^.]*)\.pkg.*/\1/g' )
[[ -z $parsedTriggerName ]] && exit 1
/usr/local/bin/jamf policy -event "$parsedTriggerName"
```
{: file='postinstall.sh'}

This script will parse the package name (sans `RunTrigger-`) and run a `jamf policy -event <PACKAGENAME>` when "installed". You name the package whatever trigger you want to run, in our case "InstallWireshark". Now build your payload-free package and voila, you have a package that will run a jamf policy based on the name of the package!

Package Info               |  Post Install Script
:-------------------------:|:-------------------------:
![The payload free package for Wireshark from Suspicious Package](Package-wireshark-light.png){: w="445" h="331.5" : .light : .right} | ![The postinstall script of the Wireshark payload free package](Package-script-wireshark-light.png){: w="445" h="331.5" : .light : .left}
![The payload free package for Wireshark from Suspicious Package](Package-wireshark-dark.png){: w="445" h="331.5" : .dark : .right } | ![The postinstall script of the Wireshark payload free package](Package-script-wireshark-dark.png){: w="445" h="331.5" : .dark : .left }

### Update your Patch Title

Now that you have a policy and a package, let's go into patch management for Wireshark and add the new payload-free package as the patch package:

![A screenshot of Wireshark's patch title version using the package we created.](Patch-wireshark.png)
_Note the package it's using.._

And update the patch policy to that version, and there you have it! Jamf patch management will now run that policy!

### But wait, there's more! (Patch per architecture!)

So why do this? Like I said above, I could technically add the scripts to the packages. Yes, it's more work to do that, but it does work. Let's look at another title: [Microsoft Powershell](https://github.com/PowerShell/PowerShell/releases/tag/v7.4.0).

![A screenshot of Powershell downloads showing different versions per architecture](powershell-downloads-dark.png){: width="451" height="238" .w-50 .right : .dark}
![A screenshot of Powershell downloads showing different versions per architecture](powershell-downloads-light.png){: width="451" height="238" .w-50 .right : .light}

Powershell has separate packages for Apple silicon and for Intel.

How do you patch your systems based on architecture? You can make another package that checks for the architecture and installs based on that, but now you're re-packaging already existing packages and you're doubling the size of the package! You could also follow Dr. K's [excellent post](https://www.modtitan.com/2023/08/using-patch-title-policies-installers.html) on setting up a second Jamf patch title feed (this is actually what I used to do), but that's kind of annoying to have to manage.  

With the payload-free package solution above, you can simply create your separate policies based on architecture and use a single trigger!

![Our Powershell policies for each architecture](Powershell-policies.png)
_Here are our policies for Powershell, note they have the same trigger._

Add your payload-free package, and name it accordingly. This allows you to use a single patch title, patch feed, and package for updating both architectures. When a new version comes out you simply update the main policies and the patch policy.

![The payload free package for Powershell from Suspicious Package](Package-powershell-light.png){: w="445" h="331.5" : .light}
![The payload free package for Powershell from Suspicious Package](Package-powershell-dark.png){: w="445" h="331.5" : .dark}
_Note the package name is the same as our trigger._

### One more thing (Installomator and Patches)

If you're a user of installomator, you probably have a bunch of policies set up already that rely on this.  Well, great news, you can use the same exact process for installomator!

![Wireshark policy using installomator](Installomator-Wireshark.png)
_Here is our wireshark policy above but with Installomator instead of a package._

Take your installomator policies, add a policy trigger (in the example, I'm using installomator-wireshark), rename your payload free package, and add the package to the patch title. You now have a patch policy that updates to latest version without having to keep up on uploading packages. A few things to note about using this method:

1. If you **really** care about which version is installed, this will not be the best method as installomator always grabs the latest version. So if you want 23.4 and 23.5 comes out while you're patching, it'll install 23.5...even if you have the package set to only 23.4.
2. You will always re-use the same package for every patch version; it will look a little weird but you'll know why!

So there you have it! A few hacks to make Jamf patch management a little more useful!
