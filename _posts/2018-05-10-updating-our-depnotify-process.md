---
id: 940
title: 'Updating Our DEPNotify Process With a LaunchDaemon'
date: '2018-05-10T14:54:48-05:00'
author: john
excerpt: "In my <a href=\"/posts/deploying-macs-with-depnotify/\">previous post</a> I discussed our process of using <a href=\"https://gitlab.com/Mactroll/DEPNotify\" target=\"_blank\" rel=\"noopener\">DEPNotify</a> to assign and deploy laptops.\_ After writing the post and sharing it, several people asked me \"what happens if the policy runs before the GUI is ready?\"\_ I found that the deployment policy ran and would just hang due to no user input because the DEPNotify window wouldn't show.\_ My simple, yet crude solution was to have our tech's manually create the admin account (which would then log in automatically) and just wait for the dock to launch.\_ This also proved to be problematic as the Dock process would start too quickly and the DEPNotify window would again fail to open.\_ I knew it was a matter of time until I switched over to a launch daemon...well....that time is now."
image: /assets/uploads/2018/05/Screen-Shot-2018-05-10-at-3.16.54-PM.png
categories: [Guides, DEPNotify]
tags: [scripts, deployment, depnotfy, jamf]
---

In my [previous post](/posts/deploying-macs-with-depnotify/) I discussed our process of using [DEPNotify](https://gitlab.com/Mactroll/DEPNotify) to assign and deploy laptops. After writing the post and sharing it, several people asked me “what happens if the policy runs before the GUI is ready?” I found that the deployment policy ran and would just hang due to no user input because the DEPNotify window wouldn’t show. My simple, yet crude solution was to have our tech’s manually create the admin account (which would then log in automatically) and just wait for the dock to launch. This also proved to be problematic as the Dock process would start too quickly and the DEPNotify window would again fail to open. I knew it was a matter of time until I switched over to a launch daemon…well….that time is now.

### Creating the Scripts

At first I just wanted a simple launch daemon that would call our enrollment script (the one I used previously), this launch daemon would run every 10 seconds until conditions were met. With a little help from slack I created my launch daemon.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>GroupName</key>
	<string>wheel</string>
	<key>InitGroups</key>
	<false/>
	<key>Label</key>
	<string>com.uarts.launch</string>
	<key>Program</key>
	<string>/var/tmp/com.uarts.DEPprovisioning.facstaff</string>
	<key>RunAtLoad</key>
	<true/>
	<key>StartInterval</key>
	<integer>10</integer>
	<key>UserName</key>
	<string>root</string>
	<key>StandardErrorPath</key>
	<string>/var/tmp/depnotify.launch.err</string>
	<key>StandardOutPath</key>
	<string>/var/tmp/depnotify.launch.out</string>
</dict>
</plist>
```
{: file='com.uarts.launch.plist'}

The checks I added were to be sure that Finder and the Dock were both running, that the user was not \_mbsetupuser (the built-in setup account) and that the “setupDone” BOM receipt I am creating afterward is not there, if those conditions are met, the launch daemon finally runs. If the process was successful, the BOM receipt drops in and will not allow it to run again, it then removes the launch daemon. Please note that I’m not unloading the launch daemon, I ran into some trouble with trying to unload it so I just went with removing it and using the BOM file to stop it from launching again if the machine isn’t rebooted after deployment (we always reboot, so it goes away anyway).

Now, at this point in my testing I was pretty satisfied but after some thought I decided that I wanted my launch daemon to do all of the heavy lifting; instead of having an enrollment policy install a script which calls another policy which calls more policies and scripts I decided to take out the middleman. Enrollment policy installs script which does everything else (runs policies and scripts). My final provisioning script ended up like this:

```bash
#!/bin/bash
#
#
# Created by John Mahlman, University of the Arts Philadelphia (jmahlman@uarts.edu)
# Name: com.uarts.DEPprovisioning.facstaff
#
# Purpose: Install and run DEPNotify at enrollment time and do some final touches
# for the users.  It also checks for software updates and installs them if found.
# This gets put in the composer package along with DEPNotofy, com.uarts.launch.plist,
# and any supporting files. Then add the post install script to the package.
#
# Get the logged in user
CURRENTUSER=$(/usr/bin/python -c 'from SystemConfiguration import SCDynamicStoreCopyConsoleUser; import sys; username = (SCDynamicStoreCopyConsoleUser(None, None, None) or [None])[0]; username = [username,""][username in [u"loginwindow", None, u""]]; sys.stdout.write(username + "\n");')
# Setup Done File
setupDone="/var/db/receipts/com.uarts.provisioning.done.bom"

JAMFBIN=/usr/local/jamf/bin/jamf

if pgrep -x "Finder" \
&& pgrep -x "Dock" \
&& [ "$CURRENTUSER" != "_mbsetupuser" ] \
&& [ ! -f "${setupDone}" ]; then

  # Kill any installer process running
  killall Installer
  # Wait a few seconds
  sleep 5

  # Let's Roll!

  # DEPNotify Log file
  DNLOG=/var/tmp/depnotify.log

  # Configure DEPNotify
  sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify PathToPlistFile /var/tmp/
  sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify RegisterMainTitle "Assignment..."
  sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify RegisterButtonLabel Assign
  sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldUpperLabel "Assigned User"
  sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldUpperPlaceholder "dadams"
  sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldLowerLabel "Asset Tag"
  sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldLowerPlaceholder "UA42LAP1337"

  echo "Command: MainTitle: Click Assign to begin Deployment" >> $DNLOG
  echo "Command: MainText: This process will assign this device and install base software." >> $DNLOG
  echo "Command: Image: /var/tmp/uarts-logo.png" >> $DNLOG
  echo "Command: DeterminateManual: 5" >> $DNLOG

  # Open DepNotify
  sudo -u "$CURRENTUSER" /var/tmp/DEPNotify.app/Contents/MacOS/DEPNotify &

  # Let's caffinate the mac because this can take long
  /usr/bin/caffeinate -d -i -m -u &
  caffeinatepid=$!

  # get user input...
  echo "Command: ContinueButtonRegister: Assign" >> $DNLOG
  echo "Status: Just waiting for you..." >> $DNLOG
  DNPLIST=/var/tmp/DEPNotify.plist
  # hold here until the user enters something
  while : ; do
  	[[ -f $DNPLIST ]] && break
  	sleep 1
  done
  # grab the username from the plist that is created so we can use it to automaticlaly create the account
  USERNAME=$(/usr/libexec/plistbuddy $DNPLIST -c "print 'Assigned User'" | tr [A-Z] [a-z])

  echo "Command: MainTitle: Preparing the system for Deployment" >> $DNLOG
  echo "Command: MainText: Please do not shutdown, reboot, or close your device, it will automatically reboot when complete." >> $DNLOG

  echo "Command: DeterminateManualStep:" >> $DNLOG
  # Do the things! We're calling a single policy now.
  echo "Status: Installing base software..." >> $DNLOG
  $JAMFBIN policy -event enroll-firstRunFACSTAFF

  echo "Command: DeterminateManualStep:" >> $DNLOG
  echo "Status: Creating local user account with password as username..." >> $DNLOG
  /usr/local/jamf/bin/jamf createAccount -username $USERNAME -realname $USERNAME -password $USERNAME -admin

  echo "Command: DeterminateManualStep:" >> $DNLOG
  echo "Status: Assigning and renaming device..." >> $DNLOG
  $JAMFBIN policy -event enroll-assignDevice

  echo "Status: Updating Inventory..." >> $DNLOG
  $JAMFBIN recon

  echo "Command: MainTitle: Almost done!" >> $DNLOG
  echo "Command: DeterminateManualStep:" >> $DNLOG
  echo "Status: Checking for and installing any OS updates..." >> $DNLOG
  /usr/sbin/softwareupdate -ia

  kill "$caffeinatepid"

  echo "Command: RestartNow:" >>  $DNLOG

  # Remove DEPNotify and the logs
  /bin/rm -Rf /var/tmp/DEPNotify.app
  /bin/rm -Rf /var/tmp/uarts-logo.png
  /bin/rm -Rf $DNLOG
  /bin/rm -Rf $DNPLIST

  # Wait a few seconds
  sleep 5
  # Create a bom file that allow this script to stop launching DEPNotify after done
  /usr/bin/touch /var/db/receipts/com.uarts.provisioning.done.bom
  # Remove the Launch Daemon
  /bin/rm -Rf /Library/LaunchDaemons/com.uarts.launch.plist

fi
exit 0
```
{: file='final-com.uarts.DEPprovisioning.facstaff.sh'}

If you choose to use the leaner script it will still work, just be sure whatever policy you call sets up DEPNotify.

### Putting it All Together

The next task was getting the program and scripts on the system at enrollment, since my last post was basically doing this in a different method it was simple to accomplish. I used Jamf Composer to build a package to drop DEPNotify, my logo file, my launch daemon, and my script, then launch the launch daemon when done.

|[![Composer with all scripts and files placed.](/assets/uploads/2018/05/Screen-Shot-2018-05-10-at-3.16.54-PM.png?resize=648%2C469&ssl=1)](/assets/uploads/2018/05/Screen-Shot-2018-05-10-at-3.16.54-PM.png?ssl=1)|
|:--:|
|Composer with all scripts and files placed.|

Make sure all of your file owners and groups are correct (everything is basically root:wheel) and be sure the permissions are correct (644 seems to work fine). And finally, the postinstall script for that package.

```bash

#!/bin/sh
## postinstall

#!/bin/sh

echo  "disable auto updates ASAP" >> /var/log/jamf.log
	defaults write /Library/Preferences/com.apple.SoftwareUpdate.plist AutomaticDownload -bool NO  
	defaults write /Library/Preferences/com.apple.SoftwareUpdate.plist ConfigDataInstall -bool NO  
	defaults write /Library/Preferences/com.apple.SoftwareUpdate.plist CriticalUpdateInstall -bool NO  
	defaults write /Library/Preferences/com.apple.commerce.plist AutoUpdateRestartRequired -bool NO  
	defaults write /Library/Preferences/com.apple.commerce.plist AutoUpdate -bool NO
	defaults write /Library/Preferences/com.apple.SoftwareUpdate.plist AutomaticCheckEnabled -bool NO

## Make the main script executable
echo  "setting main script permissions" >> /var/log/jamf.log
	chmod a+x /var/tmp/com.uarts.DEPprovisioning.facstaff.sh

## Set permissions and ownership for launch daemon
echo  "set LaunchDaemon permissions" >> /var/log/jamf.log
	chmod 644 /Library/LaunchDaemons/com.uarts.launch.plist
	chown root:wheel /Library/LaunchDaemons/com.uarts.launch.plist

## Load launch daemon into the Launchd system
echo  "load LaunchDaemon" >> /var/log/jamf.log
	launchctl load /Library/LaunchDaemons/com.uarts.launch.plist

exit 0		## Success
exit 1		## Failure
```
{: file='postinstall.sh'}

While lines 18-32 are the only ones needed I really like to have the rest. They temporarily change some settings so that if the person setting up the machine (in our case, the techs) decide to let the laptop sit for a while before deploying or if they close the lid/shutdown updates don’t try to run.

Build the package, set it to run with an “Enrollment” trigger on your appropriate Pre-stage enrollment machines and you should be off to the races.

While testing this method the DEPNotify GUI always comes up (even with waiting at weird times) and the deployment policy I have never runs until the user is fully logged in. Would I say this will work every single time? No, because there will always be an edge case, but so far it’s been working for us perfectly.

In order for us to move forward with a more “unattended” DEP deployment I’m going to work on a process that will create a user that will automatically log in (probably using [pyCreateUserpkg](https://github.com/gregneagle/pycreateuserpkg)), reboot then launch the launch daemon without user input. This will probably happen within the next few weeks and hopefully I’ll have another updated post!

You can find all of the scripts I use with DEPNotify on my [Git](https://github.com/jmahlman/Mac-Admin-Scripts/tree/master/UArts%20Scripts%20(Archived)/tree/master/DEP%20Scripts). That folder also includes my original script from the last post as well as my “assign and rename” script.

#### Notes

- Thanks to @techgrltweeter in the Mac Admins slack for some of her suggestions with the postinstall script and launch daemon
- Thanks to everyone in the #depnotify channel also, you are all awesome!
