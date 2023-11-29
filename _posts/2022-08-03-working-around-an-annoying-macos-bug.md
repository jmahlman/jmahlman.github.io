---
title: 'Working around an Annoying macOS Bug'
date: '2022-08-03T13:00:04-05:00'
author: john
excerpt: "Stop me if you're heard this before; you upgrade your M1 Mac and try to run something that needs Rosetta, you know it was installed but macOS tells you you need to install it again. I know I'm not the only one, it's in the MacAdmins Slack a bunch. Seems that macOS likes removing Rosetta during upgrades for some reason. While this may not be an issue for most people but if you have something that starts at boot time that requires Rosetta (say...a security app) what happens? You have Rosetta re-install after updates, right? In jamf you probably have a policy or script that just runs `softwareupdate --install-rosetta --agree-to-license` when an update happens or an EA that updates, either way you have something to install it. Well, what happens when that app is controlling your network and because it cannot start you have no internet access? Well...crap."
image: 
categories: [Guides]
tags: [apple, jamf]
---

Stop me if you're heard this before; you upgrade your M1 Mac and try to run something that needs Rosetta, you know it was installed but macOS tells you you need to install it again. I know I'm not the only one, it's in the MacAdmins Slack a bunch. Seems that macOS likes removing Rosetta during upgrades for some reason. While this may not be an issue for most people but if you have something that starts at boot time that requires Rosetta (say...a security app) what happens? You have Rosetta re-install after updates, right? In jamf you probably have a policy or script that just runs `softwareupdate --install-rosetta --agree-to-license` when an update happens or an EA that updates, either way you have something to install it. Well, what happens when that app is controlling your network and because it cannot start you have no internet access? Well...crap.

This issue has been hitting us on upgrade from macOS 12.4 to 12.5 but it doesn't seem to be happening on every machine. I am able to replicate it every time I downgrade and upgrade my M1 MacBook but my colleague didn't see it on his. I also only had one report from a user while we have over 50 M1 Macs successfully upgraded. I have also seen this on every update on my Ventura beta tester. The only way I found to remedy this issue was to boot the Mac into safe mode and either install rosetta using the command line tool (which seems to work 50% of the time...sometimes it just hangs) or to pull the config profile that allows the network extension to load (MDM still works in safe mode it seems). Very odd and annoying, so I went looking for a better solution and came up with only one option: install the Rosetta package manually. This would be great if 1: I had the installer available already and 2: I am an admin. Both or those happen to be untrue for my userbase, so now what?

## A helper that shouldn't be needed

The first step was to figure out how to get the Rosetta package to install offline. This was simple as [someone had already done it](https://www.alansiu.net/2021/03/24/copying-the-rosetta-2-installer-for-offline-installations/). TL;DR: Run `softwareupdate --install-rosetta --agree-to-license` to install Rosetta 2. Then, run `grep "RosettaUpdateAuto.pkg" /var/log/install.log` to find where the installer downloaded to and grab thr pkg. Once I had the package I packaged it up so I can drop it on a machine in a location I knew about and that it wouldn't remove it. Now that I have the package, I waned to have the machine install it when it boots and finds Rosetta missing. This is where I decided to make a launch daemon to run a script.

### Launch Daemon

Here is the launch daemon for launching a script. Just set this to `RunAtLoad` and you're set.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$toolIdentifier</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/zsh</string>
        <string>/Library/Application Support/$orgNameDir/$toolIdentifier.zsh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### Script

Now, the script that the launch daemon runs. I wanted this to only run on M1 Macs and only if Rosetta wasn't found. I also wanted it to log when it ran to a plist file that we collect with an extension attribute. Here is the script with some additional logging info. 

```bash
#!/bin/zsh
SCRIPTVER=1.2

logFile="/var/log/com.pretendco.rosettaOfflineInstaller.log"

initiateLog(){
    [[ ! -e "$logFile" ]] && /usr/bin/touch "$logFile"
}
writeLog(){
    msg=$*
    echo "$(date '+%Y.%m.%d-%H:%M:%S %Z') $msg" | /usr/bin/tee -a "$logFile"
}

initiateLog
writeLog "Rosetta Offline Installer script version: $SCRIPTVER"

# Check if it's an M1 Mac and install rosetta if needed
# This rosetta check is taken from https://mostlymac.blog/2022/01/13/detecting-if-rosetta-2-is-installed-on-an-apple-silicon-mac/
if [[ "$(sysctl -n machdep.cpu.brand_string)" == *'Apple'* ]]; then
    writeLog "Apple Silicon - Checking if Rosetta is installed"
    if arch -x86_64 /usr/bin/true 2> /dev/null; then
        writeLog "Rosetta installed, skipping."
    else
        writeLog "Rosetta not installed, installing"
        /usr/sbin/installer -pkg /Library/Application\ Support/Pretendco/CIO\ Services/RosettaUpdateAuto_offline.pkg -target /
        writeLog "Installer exited with code $?"
        # Mark that we actually ran this so we can gather data in Jamf
        /usr/bin/defaults write /Library/Preferences/com.pretendco.system.plist rosettaInstalled "$(date '+%F %T')"
    fi
fi
```

Hopefully this is pretty self explanatory; check if the CPU contains "Apple", if yes, then checks if the system is able to run x86_64 intel code using the arch binary. Pretty clean and simple.

### Put it together

I like installing launch daemons with a script instead of a package, so let's put everything together in a nice single script. This script has extra functions and some conctants to set, make sure you check the whole thing before you go about using it. One thing to note, you may want to only have this install on machines that have the package already on the computer or install when you run this script; however you determine that is up to you. In our case I just have that single line check after the constants.

```bash
#!/bin/zsh
#shellcheck shell=bash

#-------------------
# Constants
#-------------------

orgName="Pretendco"
orgNameDir="Pretendco/Scripts"
shortToolName="rosettaOfflineInstaller"
toolIdentifier="com.$orgName.$shortToolName"

# Check to see if the Rosetta package exists, if not, install it.
[[ ! -e /Library/Application\ Support/$orgName/RosettaUpdateAuto_offline.pkg ]] && jamf policy -event rosettaOfflineInstall

# Define the contents of the LaunchDaemon plist file
# Note: END slug is unquoted, so we can use variables inside the following:
launchDaemonContents=$(/bin/cat <<END_LAUNCHDAEMON
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$toolIdentifier</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/zsh</string>
        <string>/Library/Application Support/$orgNameDir/$toolIdentifier.zsh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
END_LAUNCHDAEMON
)

# Define the contents of the payload script
# Note: END slug is quoted, so cannot use variables in the following:
payloadScriptContents=$(/bin/cat <<'END_PAYLOADSCRIPT'
#!/bin/zsh
SCRIPTVER=1.2

logFile="/var/log/com.pretendco.rosettaOfflineInstaller.log"

initiateLog(){
    [[ ! -e "$logFile" ]] && /usr/bin/touch "$logFile"
}
writeLog(){
    msg=$*
    echo "$(date '+%Y.%m.%d-%H:%M:%S %Z') $msg" | /usr/bin/tee -a "$logFile"
}

initiateLog
writeLog "Rosetta Offline Installer script version: $SCRIPTVER"

# Check if it's an M1 Mac and install rosetta if needed
# This rosetta check is taken from https://mostlymac.blog/2022/01/13/detecting-if-rosetta-2-is-installed-on-an-apple-silicon-mac/
if [[ "$(sysctl -n machdep.cpu.brand_string)" == *'Apple'* ]]; then
    writeLog "Apple Silicon - Checking if Rosetta is installed"
    if arch -x86_64 /usr/bin/true 2> /dev/null; then
        writeLog "Rosetta installed, skipping."
    else
        writeLog "Rosetta not installed, installing"
        /usr/sbin/installer -pkg /Library/Application\ Support/Pretendco/CIO\ Services/RosettaUpdateAuto_offline.pkg -target /
        writeLog "Installer exited with code $?"
        # Mark that we actually ran this so we can gather data in Jamf
        /usr/bin/defaults write /Library/Preferences/com.pretendco.system.plist rosettaInstalled "$(date '+%F %T')"
    fi
fi
END_PAYLOADSCRIPT
)

#-------------------
# Functions
#-------------------

install(){
    ## Make the directory structure for your org if it doesn't already exist
    /bin/mkdir -p "/Library/Application Support/$orgNameDir"

    ## Write out the script
    /bin/cat <<< $payloadScriptContents > "/Library/Application Support/$orgNameDir/$toolIdentifier.zsh"

    ## Make script executable
    /bin/chmod +x "/Library/Application Support/$orgNameDir/$toolIdentifier.zsh"

    ## If the LaunchDaemon is loaded, unload it
    /bin/launchctl list | grep "$toolIdentifier" && /bin/launchctl unload -w /Library/LaunchDaemons/$toolIdentifier.plist

    ## Write out the LaunchDaemon
    /bin/cat <<< $launchDaemonContents > "/Library/LaunchDaemons/$toolIdentifier.plist"

    ## Set permissions and load the LaunchDaemon
    /usr/sbin/chown root:wheel /Library/LaunchDaemons/$toolIdentifier.plist
    /bin/chmod 644 /Library/LaunchDaemons/$toolIdentifier.plist
    /bin/launchctl load -w /Library/LaunchDaemons/$toolIdentifier.plist

}

uninstall(){
    ## Unload the LaunchDaemon
    /bin/launchctl unload -w /Library/LaunchDaemons/$toolIdentifier.plist

    ## Remove the LaunchDaemon
    /bin/rm "/Library/LaunchDaemons/$toolIdentifier.plist"

    ## Remove the payload script
    /bin/rm "/Library/Application Support/$orgNameDir/$toolIdentifier.zsh"

    ## Remove the logfile
    /bin/rm "/var/log/$toolIdentifier.log"

}

#------------------------------------------------------------------------------
# Start Script
#------------------------------------------------------------------------------

[[ "$1" == "uninstall" ]] && uninstall || install
[[ "$4" == "uninstall" ]] && uninstall || install
```

I also have an extension attribute to collect the date and time that it installed Rosetta (if ever).

```bash
#!/bin/zsh
#shellcheck shell=bash

PLIST="/Library/Preferences/com.pretendco.system.plist"

# Get the setting from the plist
result=$(/usr/bin/defaults read $PLIST rosettaInstalled 2>/dev/null)

if [[ "$(sysctl -n machdep.cpu.brand_string)" == *'Apple'* ]]; then
    [[ "$result" ]] && echo "<result>$result</result>" || echo "<result>Not Run</result>"
else
    echo "<result>Ineligible</result>"
fi

exit 0
```

### Does it work?

In testing, it seems to work when updating the OS from one minor version to another (12.4->12.5). I have had issues so far when upgrading from a major version to another (12->13). I'm going to continue to work on this to see if I can improve it but I think I have a good starting point here!

Oh! A quick note; I've decided to put all of my code directly into the post instead of using gists. Let me know if you like this better :)

Cheers!
