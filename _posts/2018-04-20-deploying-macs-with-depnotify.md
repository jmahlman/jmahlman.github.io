---
id: 886
title: 'Deploying Macs with DEPNotify'
date: '2018-04-20T13:09:14-05:00'
author: john
excerpt: "\"<a href=\"https://www.google.com/search?q=imaging+is+dead&amp;oq=imaging+is+dead\" target=\"_blank\" rel=\"noopener\">Imaging is dead!</a>\" is the new phrase for Mac Admins.\_ Nearly every Mac blog I follow has a post about the death of imaging, but I've held off on it because I think enough has been said about it already.\_ I will start this post off with my very condensed thoughts on the death of imaging:\r\n<h5 style=\"padding-left: 30px;\"><em><span style=\"color: #000000;\">I like being able to NetBoot and completely erase and install a system.\_ It's something that's been around for a very long time and it works very well.\_ I'm fine with adding more options for deploying/setting-up a system, but why remove something that's worked for so long?\_ I used to be able to send out a single command to every machine, have them reboot to a NetBoot set, image, and be waiting for me in the morning...now I can't.\_ So while I'm sad(angry) that imaging is apparently going away if Apple gives us the tools to make DEP deployments easier, I'll finally praise that \"imaging is dead.\"\_ </span></em></h5>\r\n<h5 style=\"padding-left: 30px;\"><em><span style=\"color: #000000;\">Until then, long live imaging.</span></em></h5>\r\nOkay, now that I got that out of the way I can continue on the whole reason for this post; DEP deployments with <a href=\"https://gitlab.com/Mactroll/DEPNotify\" target=\"_blank\" rel=\"noopener\">DEPNotify</a>!\r\n<h3>What is DEPNotify, and why?</h3>\r\nDEPNotify is a tool by <a href=\"https://gitlab.com/Mactroll\" target=\"_blank\" rel=\"noopener\">Joel Rennich</a>, the creator\_<a href=\"https://nomad.menu/\" target=\"_blank\" rel=\"noopener\">NoMAD</a>, to \"let your users know what's going on during a DEP enrollment.\"  Basically, it's an application that you lay down at enrollment time and then script it to show the user that DEP is actually doing things instead of having them done in the background.\_ It's a simple tool that doesn't really require much setup on the server-side and can be scripted very easily."
image: /assets/uploads/2018/04/Screen-Shot-2018-04-19-at-1.00.00-PM.png
categories: [Guides, DEPNotify]
tags: [depnotify, jamf, scripts, deployment]
---

>I have updated this process with a launch daemon! You can see the updated post [here](/posts/updating-our-depnotify-process/). This process still works, but the launch daemon will solve some timing issues that you may have.
{: .prompt-info }

“[Imaging is dead!](https://www.google.com/search?q=imaging+is+dead&oq=imaging+is+dead)” is the new phrase for Mac Admins. Nearly every Mac blog I follow has a post about the death of imaging, but I’ve held off on it because I think enough has been said about it already. I will start this post off with my very condensed thoughts on the death of imaging:

##### *I like being able to NetBoot and completely erase and install a system. It’s something that’s been around for a very long time and it works very well. I’m fine with adding more options for deploying/setting-up a system, but why remove something that’s worked for so long? I used to be able to send out a single command to every machine, have them reboot to a NetBoot set, image, and be waiting for me in the morning…now I can’t. So while I’m sad(angry) that imaging is apparently going away if Apple gives us the tools to make DEP deployments easier, I’ll finally praise that “imaging is dead.”*

##### *Until then, long live imaging.*

Okay, now that I got that out of the way I can continue on the whole reason for this post; DEP deployments with [DEPNotify](https://gitlab.com/Mactroll/DEPNotify)!

### What is DEPNotify, and why?

DEPNotify is a tool by [Joel Rennich](https://gitlab.com/Mactroll), the creator [NoMAD](https://nomad.menu/), to “let your users know what’s going on during a DEP enrollment.” Basically, it’s an application that you lay down at enrollment time and then script it to show the user that DEP is actually doing things instead of having them done in the background. It’s a simple tool that doesn’t really require much setup on the server-side and can be scripted very easily.

DEPNotify is not the only tool out there to accomplish this; we considered [SplashBuddy](https://github.com/Shufflepuck/SplashBuddy) because it’s really nice looking and very extensible, but it requires you to name packages and policies a specific way and you have to use CSS/HTML to make it look a specific way, we wanted something a little simpler, and for our workflow DEPNotify worked fine for us.

I also found out recently that jamf is going to be [testing their own](https://www.jamf.com/jamf-nation/feature-requests/6562/native-jamf-dep-screen-utility) built-in DEP splash screen/on-boarding feature (you can see my comments in there). While this is excellent news (and hopefully the feature is really well integrated within jamf pro) we needed something before we starting giving out laptops to people in the summer and since jamf is only in preliminary testing, I’m assuming this feature won’t be available for some time.

### So, now what?

We first had to figure out who will be running the deployment process on our laptops, this would help us decide how polished our process should be. Since at the moment we’re only deploying laptops to faculty and staff using DEP, I focused on how our current laptops are deployed to see if I can keep it similar enough that our support services team could handle it without too many issues. This meant a few things;

1. The process didn’t have to be completely polished…yet. Our techs are obviously more tech savvy than our faculty and staff, so they can handle having to do a little manual work if needed.
2. The machines should have the ability to be prepped in advance without having to assign them to a person. (See the [update below](#update) about this)
3. The process should allow for addition of new things if needed down the line. We also wanted to use this process as a beta test for when we have to deploy all of our iMacs in labs using DEP.

DEP allows for us to add an administrator account as it’s enrolling and it also allows you to add a local account at enrollment by asking the user to create it. <del>While this is a nice feature we found that 1: it didn’t work as intended all of the time, often the **hidden** admin account wouldn’t be created when a local account was also selected; and 2: we didn’t want the tech’s to have to assign the machine right then and there. So we ended up just creating the local admin account at enrollment time (which DOES work every time). What is nice about this is that after you go through the enrollment process the machine will simply stop at the login window and proceed no further. The laptop could then be put away and assigned later. This part was simple and DEPNotify doesn’t even factor in yet.</del> See the [update below](#update) for why this is crossed out.

DEPNotify runs in a user session and relies on scripting to show the user what’s going on; the script will also “do the things” that need to be done at enrollment time of course. In our case we wanted to lay some basic software down and possibly customize the machine name and local user account. Now, I’m not going to go over every command with DEPNotify, you can find that on the GitLab website, but a general idea of how it works from the DEPNotify website:

DEPNotify is completely controlled via echoing text to it’s control file. By default this is `/var/tmp/depnotify.log` but you can change this to anything you want by launching the app with the `-path [some path]`.

The application then reacts to `Command:` and `Status:` lines written to the control file.

So you `echo "Command: some command: something else"` into (`>>`) the log file and it reads it and updates the GUI. Very simple! I started with a very basic script just to test functionality and see how it works.

```bash
#!/bin/bash

JAMFBIN=$(/usr/bin/which jamf)
CURRENTUSER=$(python -c 'from SystemConfiguration import SCDynamicStoreCopyConsoleUser; import sys; username = (SCDynamicStoreCopyConsoleUser(None, None, None) or [None])[0]; username = [username,""][username in [u"loginwindow", None, u""]]; sys.stdout.write(username + "\n");')

# Install DEPNotify first (set this up in your jamf server of course)
$JAMFBIN policy -event install_depnotify
DNLOG=/var/tmp/depnotify.log

# Setup DEPNotify
echo "Command: MainTitle: Preparing Device for Deployment" >> $DNLOG
echo "Status: Installing some stuff..." >> $DNLOG

#Open DepNotify
sudo -u "$CURRENTUSER" /var/tmp/DEPNotify.app/Contents/MacOS/DEPNotify &

# Do the things!
echo "Status: Doin' the things..." >> $DNLOG
$JAMFBIN policy -event some-policy

echo "Status: Doin' more things..." >> $DNLOG
$JAMFBIN policy -event another-policy

echo "Command: RestartNow:" >> $DNLOG

# Remove DEPNotify and the logs
rm -Rf /var/tmp/DEPNotify.app
rm -Rf $DNLOG
```
{: file='DEPNotify-Outline.sh'}

That script was set to run with the trigger “Enrollment Complete” in my jamf server, and it was scoped to a smart group that holds all machines with “Enrollment Method: PreStage enrollment &lt;name&gt;.”

I booted a computer that went through internet recovery and went through the setup process and sure enough I was logged in and the DEPNotify window popped up and started doing what I told it to do. A great start! So now I was hoping to customize the machine during this time, but DEPNotify out of the box does not allow for user input. Initially I was going to have our team run through the process and then open up jamf Self Service and run a “Rename Computer” policy we have in there, but this is just more work for them, and what if someone forgot ton do that? We would have 100 “macadmin’s MacBook Pro” in our jamf server. The MacAdmins community came to the rescue!

While looking for assistance in the #depnotify channel on the [MacAdmins slack](https://macadmins.slack.com/) a user named @fgd (contact info below) mentioned that he was working on a [forked build](https://slack-files.com/T04QVKUQG-FAE6G2T55-d128fcfe22) of DEPNotify that would allow for user input. (**Update: It’s now added into DEPNotify as of 1.0.4**) The new build would look for a pref file (`menu.nomad.DEPNotify`) on the system and gather information from that and when DEPNotify saw `Command: ContinueButtonRegister: <buttonName>` in it’s control file it would show a user input dropdown. This dropdown can be customized a number of ways in the prefs file and when the user is done entering the information and continues the process a plist file with the information would be dropped in a location specified in the prefs file. So I began testing with some assistance from users in the #depnotify channel, my script started to grow; note that we’re editing the prefs file for the current user with the defaults write commands.

```bash
#!/bin/bash

JAMFBIN=$(/usr/bin/which jamf)
CURRENTUSER=$(python -c 'from SystemConfiguration import SCDynamicStoreCopyConsoleUser; import sys; username = (SCDynamicStoreCopyConsoleUser(None, None, None) or [None])[0]; username = [username,""][username in [u"loginwindow", None, u""]]; sys.stdout.write(username + "\n");')

# Install DEPNotify first (set this up in your jamf server of course)
$JAMFBIN policy -event install_depnotify
DNLOG=/var/tmp/depnotify.log

# Setup DEPNotify prefs and starting GUI

# where to drop the plist after input
sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify PathToPlistFile /var/tmp/
sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify RegisterMainTitle "Assignment..."
sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify RegistrationButtonLabel Assign
sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldUpperLabel "Assigned User"
sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldUpperPlaceholder "dadams"
sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldLowerLabel "Asset Tag"
sudo -u "$CURRENTUSER" defaults write menu.nomad.DEPNotify UITextFieldLowerPlaceholder "UA42LAP1337"
echo "Command: MainTitle: Preparing Device for Deployment" >> $DNLOG
echo "Status: Installing some stuff..." >> $DNLOG

#Open DepNotify
sudo -u "$CURRENTUSER" /var/tmp/DEPNotify.app/Contents/MacOS/DEPNotify &

# Do the things!
echo "Status: Doin' the things..." >> $DNLOG
$JAMFBIN policy -event some-policy

echo "Status: Doin' more things..." >> $DNLOG
$JAMFBIN policy -event another-policy

# call the user input dropdown
echo "Command: ContinueButtonRegister: Assign" >> $DNLOG
# We have the plist...now what?

# We'll quit the app after we're done...but something is wrong..
echo "Command: Quit: Done!" >> $DNLOG

# Remove DEPNotify and the logs
rm -Rf /var/tmp/DEPNotify.app
rm -Rf $DNLOG
rm -Rf $DNPLIST
```
{: file='DEPNotify-UserInput-test.sh'}

You can see lines 33-35 are calling the user input dropdown but you see the question, “Now what?” We have the plist, but we’re not doing anything with it. There was also another problem I ran into with this part, since DEPNotify just reads from a stream and the user input dropdown is just a command getting sent in, it doesn’t know that it needs to wait for user input to continue. This means that the next command, `echo "Command: Quit: Done!" >> $DNLOG`, just goes into the command file thus causing DEPNotify to quit without getting input. I tried moving the assignment line up to the beginning, which worked better because the machine was doing everything and had enough time for me to enter some info…but if I didn’t enter anything and let it sit, it would just quit. So I just added a loop to check for the plist file to be created.

```bash
# get user input...  
echo "Command: ContinueButtonRegister: Assign" >> $DNLOG  
DNPLIST=/var/tmp/DEPNotify.plist  
# hold here until the user enters something  
while : ; do  
  [[ -f $DNPLIST ]] && break  
  sleep 1  
done
```

Fairly inelegant, but it gets the job done. Now I drop that in wherever I want the user to enter the information, in my case I added it to the beginning so the process wouldn’t even start until the tech entered information.

Next was figuring out how to get that information back into the jamf server. The plist file we have looks like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Asset Tag</key>
	<string>ua14lap1337</string>
	<key>Assigned User</key>
	<string>jmahlman</string>
	<key>Computer Serial</key>
	<string>XXXXXXXXXX</string>
	<key>Computer UUID</key>
	<string>XXXXXXXXXXXXXXXX</string>
	<key>Default Lower label</key>
	<string>Item 1</string>
	<key>Default Upper label</key>
	<string>Item 1</string>
	<key>Regitration Date</key>
	<string>04-19-2018 19:25</string>
</dict>
</plist>
```
{: file='sample-DEPNotify.plist'}

Using the jamf API we can easily drop these into the server by pulling the info we care about from this plist. I’m just linking to my full script since it’s fairly self explanatory for anyone who will need it: [git script](https://github.com/jmahlman/Mac-Admin-Scripts/blob/master/UArts%20Scripts%20(Archived)/DEP%20Scripts/DEP-DEPNotify-assignAndRename.sh). We’re just using plistbuddy to scrape the information from the plist file into some variables and then pushing them out to the API. This script will update the username field in the jamf server, fill in the asset tag information and rename the machine locally using our naming convention.

I also wanted to automate user creation, this was easy to add in our script with one line (well, it’s technically two lines but only one command):

```bash
echo "Status: Creating local user account with password as username..." >> $DNLOG
$JAMFBIN createAccount -username $USERNAME -realname $USERNAME -password $USERNAME -admin
```

Now I know, it’s not secure at all but keep in mind that this process is currently for our techs to get the computer prepped to give to the end-user, once he/she gets their machine the tech will instruct them to change their password.

So finally, I put everything together and added some other polish to the DEPNotify window (I really like that you can change the notes on the screen in the GUI on the fly to give the user more info) and had a working deployment process for our techs.

| [![DEPNotify process condensed animation](/assets/uploads/2018/04/DEP-Animated.gif?resize=648%2C448&ssl=1)](/assets/uploads/2018/04/DEP-Animated.gif?ssl=1) |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                 DEPNotify process condensed                                                                 |

The little animation above is our DEPNotify process, notice that there is a warning in one that tells the user to “approve when asked” for Symantec Antivirus. This is due to the “[kextpocalypse](https://blog.eriknicolasgomez.com/2017/07/25/Kextpocalypse-High-Sierra-and-kexts-in-the-Enterprise/)” in High Sierra and the fact that we do not have kext whitelisting enabled yet (we’re still running jamf 9). Once we upgrade to jamf 10, that should go away; in the meantime the user/tech is asked to approve the Symantec kext at installation time. Because of this we also do not use two of the flags in DEPNotify that we really wanted; `--fullScreen` and `Command: WindowStyle: NotMovable`. After we upgrade we should be able to bring those back. You can find the final script that we use [right here](https://github.com/jmahlman/Mac-Admin-Scripts/blob/master/UArts%20Scripts%20(Archived)/DEP%20Scripts/DEP-DEPNotify-firstRunFACSTAFF.sh) on my git page.

#### **Update**

Someone in the #depnotify channel brought up that DEPNotify has to run when a user is logged in, but the jamf trigger is EnrollmentComplete. This brings up the issue of what happens if the user just sits at the login window…which is a good question. I decided to change a little bit of the process to just make our techs create the assigned users account at DEP enrollment time which will cause the computer automatically log in. This will then make sure that a user is logged in when DEPNotify kicks off. Now, this messes with our desire to set up a machine without assigning it but it’s a small price to pay for it to work almost every time instead of a coin-toss. Eventually I’d like to just move it to a Launch Agent but for the time being this method is what we’re going to roll with.

### So, what’s next?

Our immediate next steps will be to generalize the script to allow us to use it on laptops and lab machines. We’re also going to make the script just call a single policy for each type of machine we have instead of hard coding all of the software policies in the script.

Eventually we’d like to have end-users set up their own laptops like Apple prefers/suggests. I already wrote a [script](https://github.com/jmahlman/Mac-Admin-Scripts/blob/master/UArts%20Scripts%20(Archived)/rename-Machine-by-User.sh) that will allow the computer to get renamed based on the AD user logging into the computer at enrollment time. Currently the main thing holding us back on that one is some networking configurations which I won’t get into here.

I also know that there is a `-jamf` flag in DEPNotify, I will most likely switch to using it when we generalize the script but for now I like the control I have.

If you have any questions or suggestions about my workflow, comment below! I always love comments on improving my scripts/criticisms.

#### Notes

- You can find the forked build on the macadmins slack here: <https://slack-files.com/T04QVKUQG-FAE6G2T55-d128fcfe22> (a merge request will eventually occur on the official DEPNotify project page, so keep an eye out for that). **Update: As of 1.0.4, DEPNotify supports the registration function!**
- You can reach user @fgd (Federico) at fdeis \[at\] mac \[dot\] com.
