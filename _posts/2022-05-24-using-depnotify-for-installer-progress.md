---
id: 1044
title: 'Using DEPNotify for Installer Progress'
date: '2022-05-24T15:06:04-05:00'
author: john
excerpt: "I’ve written a few times about DEPNotify; I really think it’s a great tool for deploying your Macs without much fuss. Since I started using it I’ve always said it would be useful for providing feedback for installs for users when using something like Jamf’s Self Service. I never got around to writing anything because I either didn’t have the time or the desire to do it…until now!"
image: /assets/uploads/2022/05/Large-install-download.png
categories: [Guides, DEPNotify]
tags: [apple, jamf, script]
---

I’ve written a few times about DEPNotify; I really think it’s a great tool for deploying your Macs without much fuss. Since I started using it I’ve always said it would be useful for providing feedback for installs for users when using something like Jamf’s Self Service. I never got around to writing anything because I either didn’t have the time or the desire to do it…until now!

> If you want to skip right to the code, you can click [this link](https://github.com/jmahlman/Mac-Admin-Scripts/blob/master/Jamf%20Large%20Install%20Helper.sh). If you want to know more about the script and don’t care for the background jump down to this [section](#a-simple-plan).
{: .prompt-tip }

### Why DEPNotify?

I chose DEPNotify for a few reasons. The first and main reason is I know it; I’ve used it before and I didn’t need to learn anything new very quickly. Another reason is that we use it for other tools; our onboarding uses NoMAD Login Notify (which is basically DEPNotify) and we use [erase-install](https://github.com/grahampugh/erase-install) for re-deploying and upgrading machines with the DEPNotify flag set. This allows us to keep a consistent user experience for our users, this is quite important. Finally, I like it because it’s just darn easy to script! It was an obvious choice for me.

### The need

Most of my users at my current job are developers; probably somewhere between 50 and 75%. They need lots of developer tools, most of these tools are pretty small…except for Xcode. Xcode is a 10GB download, unxipped it’s 16GB and then installed with the SDKs and sims it’s around 33GB. I have tried using Apple’s VPP to deploy Xcode with very mixed results usually ending in failure; this unfortunately means that we have to package Xcode, store it, and server it to update and install for our user-base. Our internal servers are definitely not as fast or robust as Apple’s CDN which means downloading that 16GB package takes quite a long time. This caused a problem for our users (and in turn, us), they would click the button to start installation and it would start but in Jamf Self Service the little progress circle would just spin and spin and spin causing tickets because people would just assume the install failed. This is where I decided to take action.

### A simple plan..

The idea is simple; when a user wants to install Xcode, I want DEPNotify to open and show the user that it’s downloading. After the download, show the install progress because this can also take a while especially with a post install script to finish things to allow non-admins to launch. I knew how to monitor a download from Jamf, but I didn’t know how to monitor the installation progress. I had to also make some decisions on *how* I’m going to complete the download and install; will I have the script do it or will I have Jamf do everything? I ended up with using a mixture.

I started with the download portion since I knew how to do that already; I decided to borrow some inspiration from the erase-install script and make some functions to handle setting up DEPNofity for various tasks.

```bash
# Call this with "install" or "download" to update the DEPNotify window and progress dialogs
depNotifyProgress() {
    last_progress_value=0
    current_progress_value=0

    if [[ "$1" == "download" ]]; then
        echo "Command: MainTitle: Downloading $APPNAME" >> $DNLOG

        # Wait for for the download to start, if it doesn't we'll bail out.
        while [ ! -f "$JAMF_DOWNLOADS/$PKG_NAME" ]; do
            userCancelProcess
            if [[ "$TIMEOUT" == 0 ]]; then
                echo "ERROR: (depNotifyProgress) Timeout while waiting for the download to start."
                {
                /bin/echo "Command: MainText: $DL_ERROR"
                echo "Status: Error downloading $PKG_NAME"
                echo "Command: DeterminateManualStep: 100"
                echo "Command: Quit: $DL_ERROR"
                } >> $DNLOG
                exit 1
            fi
            sleep 1
            ((TIMEOUT--))
        done

        # Download started, lets set the progress bar
        echo "Status: Downloading - 0%" >> $DNLOG
        echo "Command: DeterminateManual: 100" >> $DNLOG

        # Until at least 100% is reached, calculate the downloading progress and move the bar accordingly
        until [[ "$current_progress_value" -ge 100 ]]; do
            # shellcheck disable=SC2012
            until [ "$current_progress_value" -gt "$last_progress_value" ]; do
                # Check if the download is in the waiting room (it moves from downloads to the waiting room after it's fully downloaded)
                if [[ ! -e "$JAMF_DOWNLOADS/$PKG_NAME" ]]; then
                    CURRENT_DL_SIZE=$(ls -l "$JAMF_WAITING_ROOM/$PKG_NAME" | awk '{ print $5 }' | awk '{$1/=1024;printf "%.i\n",$1}')
                    userCancelProcess
                    current_progress_value=$((CURRENT_DL_SIZE * 100 / PKG_Size))
                    sleep 2
                else
                    CURRENT_DL_SIZE=$(ls -l "$JAMF_DOWNLOADS/$PKG_NAME" | awk '{ print $5 }' | awk '{$1/=1024;printf "%.i\n",$1}')
                    userCancelProcess
                    current_progress_value=$((CURRENT_DL_SIZE * 100 / PKG_Size))
                    sleep 2
                fi
            done
            echo "Command: DeterminateManualStep: $((current_progress_value-last_progress_value))" >> $DNLOG
            echo "Status: Downloading - $current_progress_value%" >> $DNLOG
            last_progress_value=$current_progress_value
        done
    fi
}
```

Jamf downloads files into /Library/Application Support/JAMF/Downloads when it runs a policy, so all we had to do was calculate the current download from the package size (also passed as a variable). Using this we can update the progress bar in DEPNotify and accurately show the user how far along their giant download is. The function also checks for the file in /Library/Application Support/JAMF/Waiting Room because jamf moves from downloads to the waiting room after it’s fully downloaded when caching, more on that in the section on setting up your jamf policy.

After the download is complete we want to quit DEPNotify and re-launch it with some updated UI elements for the installation. This part seemed simple but I didn’t know how to monitor installation process since the packages didn’t output any percentages. I first was trying to use a timer to “estimate” the installer; basically pass a variable of “how many seconds *should* this take to install” and update the progress bar using that. I wrote a manual install function:

```bash
#BEGINNING OF FUNCTION GOES HERE

    elif [[ "$1" == "manualInstall" ]]; then
        echo "Command: MainTitle: Installing $APPNAME" >> $DNLOG
        # Install started, lets set the progress bar
        {
            echo "Command: Image: $INSTALL_ICON"
            /bin/echo "Command: MainText: $INSTALL_DESC"
            echo "Status: Preparing to Install $PKG_NAME"
            echo "Command: DeterminateManual: $INSTALL_TIMER"
        } >> $DNLOG

        # Update the progress using a timer until a receipt is found. If it gets full it'll just wait for a receipt.
        until [[ "$current_progress_value" -ge $INSTALL_TIMER ]] && [[ $(receiptIsPresent) -eq 1 ]]; do
            userCancelProcess
            sleep 5
            current_progress_value=$((current_progress_value + 5))
            echo "Command: DeterminateManualStep: 5" >> $DNLOG
            echo "Status: Installing $PKG_NAME" >> $DNLOG
            receiptIsPresent && break
            last_progress_value=$current_progress_value
        done
    fi
# END OF FUNCTION GOES HERE

receiptIsPresent() {
    if [[ $(find "/Library/Application Support/JAMF/Receipts/$PKG_NAME" -type f -maxdepth 1) ]]; then
        current_progress_value="100"
        # If it finds the receipt, just set the progress bar to full
        {
        echo "Installer is not running, exiting."
        echo "Command: DeterminateManualStep: 100"
        echo "Status: $PKG_NAME successfully installed."
        } >> $DNLOG
        sleep 10
        return 0
    fi
return 1
}
```

This worked but it wasn’t really robust for obvious reasons. I really didn’t like this idea from the start but I didn’t know of any good way to monitor the installation..until I discovered that the jamf binary can help out here. The jamf binary has an “install” flag which has a bunch of modifiers:

```text
Usage: jamf install -package <filename> -path <path to file> -target <volume>
 [-fut] [-feu] [-showProgress] 
 -package  The filename of the package that will be installed.
 -path  The path to the package. This does not include the name of the package.
 -target  The drive that the package will be installed to.
 -fut  The Fill User Templates option takes any user data and populates the files to the user templates so any new user created on the system will have these files.
 -feu  Fill Existing Users option takes any user data and populates the files to every user on the computer that has a home directory.
 -showProgress  Displays the progress of the HTTP download and the progress of the installation process.
```

I tried out the –showProgress modifier and to my surprise I was getting progress updates on installs. An example of what this outputs:

```text
~> Waiting Room # jamf install -package Microsoft-Visual\ Studio\ Code-1.66.2.pkg -path /Library/Application\ Support/JAMF/Waiting\ Room -showProgress
Installing Microsoft-Visual Studio Code-1.66.2.pkg...
<progress status="Installing Microsoft-Visual Studio Code-1.66.2.pkg...">
installer: Package name is Microsoft-Visual Studio Code-1.66.2
installer: Installing at base path /
installer:PHASE:Preparing for installation…
installer:PHASE:Preparing the disk…
installer:PHASE:Preparing Microsoft-Visual Studio Code-1.66.2…
installer:PHASE:Waiting for other installations to complete…
installer:PHASE:Configuring the installation…
installer:STATUS:
installer:%4.533645
installer:PHASE:Writing files…
installer:%7.514941
installer:PHASE:Writing files…
installer:%8.873586
installer:PHASE:Writing files…
installer:%17.025453
installer:PHASE:Writing files…
installer:%26.535965
installer:PHASE:Writing files…
installer:%44.198345
installer:PHASE:Writing files…
installer:%61.860724
installer:PHASE:Writing files…
installer:PHASE:Validating packages…
installer:%97.262500
installer:PHASE:Registering updated applications…
installer:%97.750000
installer:STATUS:
installer:PHASE:Finishing the Installation…
installer:STATUS:
installer:%100.000000
installer:PHASE:The software was successfully installed.
installer: The install was successful.
<exitCode>0</exitCode>
</progress>
Successfully installed Microsoft-Visual Studio Code-1.66.2.pkg.
```

I decided to use the same function but added an “install” argument; here is the whole function:

```bash
# Call this with "install" or "download" to update the DEPNotify window and progress dialogs
depNotifyProgress() {
    last_progress_value=0
    current_progress_value=0

    if [[ "$1" == "download" ]]; then
        echo "Command: MainTitle: Downloading $APPNAME" >> $DNLOG

        # Wait for for the download to start, if it doesn't we'll bail out.
        while [ ! -f "$JAMF_DOWNLOADS/$PKG_NAME" ]; do
            userCancelProcess
            if [[ "$TIMEOUT" == 0 ]]; then
                echo "ERROR: (depNotifyProgress) Timeout while waiting for the download to start."
                {
                /bin/echo "Command: MainText: $DL_ERROR"
                echo "Status: Error downloading $PKG_NAME"
                echo "Command: DeterminateManualStep: 100"
                echo "Command: Quit: $DL_ERROR"
                } >> $DNLOG
                exit 1
            fi
            sleep 1
            ((TIMEOUT--))
        done

        # Download started, lets set the progress bar
        echo "Status: Downloading - 0%" >> $DNLOG
        echo "Command: DeterminateManual: 100" >> $DNLOG

        # Until at least 100% is reached, calculate the downloading progress and move the bar accordingly
        until [[ "$current_progress_value" -ge 100 ]]; do
            # shellcheck disable=SC2012
            until [ "$current_progress_value" -gt "$last_progress_value" ]; do
                # Check if the download is in the waiting room (it moves from downloads to the waiting room after it's fully downloaded)
                if [[ ! -e "$JAMF_DOWNLOADS/$PKG_NAME" ]]; then
                    CURRENT_DL_SIZE=$(ls -l "$JAMF_WAITING_ROOM/$PKG_NAME" | awk '{ print $5 }' | awk '{$1/=1024;printf "%.i\n",$1}')
                    userCancelProcess
                    current_progress_value=$((CURRENT_DL_SIZE * 100 / PKG_Size))
                    sleep 2
                else
                    CURRENT_DL_SIZE=$(ls -l "$JAMF_DOWNLOADS/$PKG_NAME" | awk '{ print $5 }' | awk '{$1/=1024;printf "%.i\n",$1}')
                    userCancelProcess
                    current_progress_value=$((CURRENT_DL_SIZE * 100 / PKG_Size))
                    sleep 2
                fi
            done
            echo "Command: DeterminateManualStep: $((current_progress_value-last_progress_value))" >> $DNLOG
            echo "Status: Downloading - $current_progress_value%" >> $DNLOG
            last_progress_value=$current_progress_value
        done
    elif [[ "$1" == "install" ]]; then
        echo "Command: MainTitle: Installing $APPNAME" >> $DNLOG
        # Install started, lets set the progress bar
        {
            echo "Command: Image: $INSTALL_ICON"
            /bin/echo "Command: MainText: $INSTALL_DESC"
            echo "Status: Preparing to Install $PKG_NAME"
            echo "Command: DeterminateManual: 100"
        } >> $DNLOG
        until grep -q "progress status" "$LOG_FILE" ; do
            sleep 2
        done
        # Update the progress using a timer until it's at 100%
        until [[ "$current_progress_value" -ge "100" ]]; do
            until [ "$current_progress_value" -gt "$last_progress_value" ]; do
                INSTALL_STATUS=$(sed -nE 's/installer:PHASE:(.*)/\1/p' < $LOG_FILE | tail -n 1)
                INSTALL_FAILED=$(sed -nE 's/installer:(.*)/\1/p' < $LOG_FILE | tail -n 1 | grep -c "The Installer encountered an error")
                if [[ $INSTALL_FAILED -ge "1" ]]; then
                    echo "Install failed, notifying user."
                    echo "Command: Quit: $INSTALL_ERROR" >> $DNLOG 
                fi
                userCancelProcess
                current_progress_value=$(sed -nE 's/installer:%([0-9]*).*/\1/p' < $LOG_FILE | tail -n 1)
                sleep 2
            done
            echo "Command: DeterminateManualStep: $((current_progress_value-last_progress_value))" >> $DNLOG
            echo "Status: $INSTALL_STATUS - $current_progress_value%" >> $DNLOG
            last_progress_value=$current_progress_value
        done
    fi
}
```

Yep, I am using the jamf binary to do the install, not the installer. This is so I can use the –showProgress flag. <u>Update</u>: someone pointed out that installer has the -verbose flag which provides the same info as the jamf binary. For some reason I forgot about this! I’ll probably expand on the script to use built in tools instead.

With these functions I can pass variables into the script and have it do what I want. I tried it out with calling a policy to do the entire download and install (just a basic install package in jamf). The process would work but if you stopped it for any reason during the install, jamf would re-download the package every time (interrupting during the download was fine since it can resume). I really didn’t want that, I’m trying to give users the ability to stop the download or install when they want and restart it again if desired (without having to download the entire 16GB again). I also don’t want to keep the download in the jamf downloads folder because if it’s there I don’t really know about it. I decided to try a caching policy; this will download the file to the downloads folder and them move it to the jamf waiting room (it also adds an XML file with some info). The good thing about this, we can pre-cache the download if we want, jamf will know about it, and we can act on it via jamf Pro if we so desire. So the function will watch the download folder and if it can’t find it there will then check the waiting room for the download to see if it’s complete and then continue on. Moreover, if the download is already in the waiting room and complete (the size matches) then we can even skip the entire download portion and go right to installing it! So my main portion of the script (the part that actually does work) is very simple:

```bash
###############
## MAIN BODY ##
###############
echo "$SCRIPT_NAME version $SCRIPTVER"
# ensure the finish function is executed when exit is signaled
trap "finish" EXIT

# ensure computer does not go to sleep while running this script
echo "   [$SCRIPT_NAME] Caffeinating this script (pid=$$)"
/usr/bin/caffeinate -dimsu -w $$ &

check_free_space
# Let's first check if the package existis in the downloads and it matches the size...
# this avoids us having to run the policy again and causing the sceript to re-download the whole thing again.
if [[ -e "$JAMF_WAITING_ROOM/$PKG_NAME" ]] && [[ $CURRENT_PKG_SIZE == "$PKG_Size" ]]; then
    echo "Package already download, installing with jamf binary."
    dep_notify
    installWithJamf
    depNotifyProgress install
    cleanupWaitingRoom
else
    dep_notify
    cachePackageWithJamf "$JAMF_TRIGGER"
    depNotifyProgress download
    sleep 5
    dep_notify_quit
    dep_notify
    installWithJamf
    depNotifyProgress install
    cleanupWaitingRoom
fi

# Run recon after installing only.
$JAMFBINARY recon
```
{: file='depNotifyInstallHelper-Working portion.sh'}

### Putting it together

The full script is [here](https://github.com/jmahlman/Mac-Admin-Scripts/blob/master/Jamf%20Large%20Install%20Helper.sh) on my Github. You’ll see that it includes a function for checking if the drive has enough free space for the install (it will show an alert if not) and has some cleanup functions for a successful run or a user quitting. I pipe all output to a log file (`/var/tmp/install-helper-DATE.log`) for easy troubleshooting and verification. This log will stick around after installs but can most likely be removed for successful runs. I also have some variables to show status and error messages and also some generic icons. You’ll also notice that the `manualInstall` part of the function call is still there. It works, I don’t use it, but I like having it there. This relies on the `receiptIsPresent` function to check to see if jamf installed the package. It also relies on a variable that I removed from the jamf parameter list: `$INSTALL_TIMER`. If you want to give this a shot, you’ll need to make some changes to the script..you can reach out to me if you want.

Anyway, the script requires a bunch of Jamf parameters to work, all are mandatory unless noted:

- Parameter 4: Friendly Application Name (ex: Apple Xcode)
- Parameter 5: Jamf Trigger for caching package (ex: cache-xcode)
  - Note that this must be a CACHING policy to work properly
- Parameter 6: Package Name (with .pkg) (ex: Apple-Xcode-13.3.1.pkg)
- Parameter 7: Package size in KB (whole numbers only) (ex: 16013572)
  - I get this with `ls -l $PACKAGENAME | awk '{ print $5 }' | awk '{$1/=1024;printf "%.i\n",$1}'`
- Parameter 8: Minimum drive space required (default 5) (**Optional**)
- Parameter 9: Extended tout time (default 60) (**Optional**)
  - How long to wait for the download to start before failing

Here’s an example from my setup:

[![screenshot of a jamf policy showing the parameters filled out](/assets/uploads/2022/05/Xcode-Installer.png)](/assets/uploads/2022/05/Xcode-Installer.png?ssl=1)

Note that there is no inventory collection in this policy because we don’t need to run it unless it actually installs. The script will just run it at the very end if it completes successfully. One useful feature; if the user pressed the quit keys (set to CMD+CTRL+C), the process will stop and take any installer or jamf policy with it but it will leave the download in place to allow Jamf to resume the download or to start the install again without having to download. The script will clean up the waiting room and other processes if it completes installation.

When a user opens Self Service and clicks the button:

| [![Example of Xcode downloading with the large install helper](/assets/uploads/2022/05/Large-install-download.png)](/assets/uploads/2022/05/Large-install-download.png?ssl=1) |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                               this pops up, much nicer than a spinning circle.                                                                |

And when its installing, this window will show:
[![Example of Xcode preparing to install with the large install helper](/assets/uploads/2022/05/Large-install-preparing.png)](/assets/uploads/2022/05/Large-install-preparing.png?ssl=1)

The text that says “Preparing to install…” is updated with the text output of the –showProgress command (anything after “installer:Phase”) and the percentage is passed in from the same command:
[![Example of Xcode preparing to install with the large install helper](/assets/uploads/2022/05/Large-install-installing.png)](/assets/uploads/2022/05/Large-install-installing.png?ssl=1)

### Final thoughts

This script started out in my head as a single use script to just get Xcode installed but I quickly realized that it would be much more useful if I can make it modular and allow for anything to use it. I actually wrote it with the intention of not sharing it because I didn’t know how useful it would be. After seeing the feedback on Slack I decided I had to share it and also write something about it.

If you have any feedback, please comment or open requests/issues on the Git page. I’d love to see if someone can add functionality for other MDMs, I don’t really have the time or resources to do that myself.

Cheers!
