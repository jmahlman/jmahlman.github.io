---
id: 940
title: 'Updating Our DEPNotify Process With a LaunchDaemon'
date: '2018-05-10T14:54:48-05:00'
author: 'John Mahlman IV'
excerpt: "In my <a href=\"/2018/04/deploying-macs-with-depnotify/\">previous post</a> I discussed our process of using <a href=\"https://gitlab.com/Mactroll/DEPNotify\" target=\"_blank\" rel=\"noopener\">DEPNotify</a> to assign and deploy laptops.\_ After writing the post and sharing it, several people asked me \"what happens if the policy runs before the GUI is ready?\"\_ I found that the deployment policy ran and would just hang due to no user input because the DEPNotify window wouldn't show.\_ My simple, yet crude solution was to have our tech's manually create the admin account (which would then log in automatically) and just wait for the dock to launch.\_ This also proved to be problematic as the Dock process would start too quickly and the DEPNotify window would again fail to open.\_ I knew it was a matter of time until I switched over to a launch daemon...well....that time is now."
layout: post
guid: '/?p=940'
permalink: /2018/05/updating-our-depnotify-process/
image: /wp-content/uploads/2018/05/Screen-Shot-2018-05-10-at-3.16.54-PM.png
categories:
    - DEP
    - jamf
    - Scripts
    - Technology
    - Work
tags:
    - DEP
    - jamf
    - mac
    - macos
    - macosx
    - script
---

In my [previous post](/2018/04/deploying-macs-with-depnotify/) I discussed our process of using [DEPNotify](https://gitlab.com/Mactroll/DEPNotify) to assign and deploy laptops. After writing the post and sharing it, several people asked me “what happens if the policy runs before the GUI is ready?” I found that the deployment policy ran and would just hang due to no user input because the DEPNotify window wouldn’t show. My simple, yet crude solution was to have our tech’s manually create the admin account (which would then log in automatically) and just wait for the dock to launch. This also proved to be problematic as the Dock process would start too quickly and the DEPNotify window would again fail to open. I knew it was a matter of time until I switched over to a launch daemon…well….that time is now.

### Creating the Scripts

At first I just wanted a simple launch daemon that would call our enrollment script (the one I used previously), this launch daemon would run every 10 seconds until conditions were met. With a little help from slack I created my launch daemon.

{% gist 301015d52fbfb9d95e59683a4f220b86 %}

The checks I added were to be sure that Finder and the Dock were both running, that the user was not \_mbsetupuser (the built-in setup account) and that the “setupDone” BOM receipt I am creating afterward is not there, if those conditions are met, the launch daemon finally runs. If the process was successful, the BOM receipt drops in and will not allow it to run again, it then removes the launch daemon. Please note that I’m not unloading the launch daemon, I ran into some trouble with trying to unload it so I just went with removing it and using the BOM file to stop it from launching again if the machine isn’t rebooted after deployment (we always reboot, so it goes away anyway).

Now, at this point in my testing I was pretty satisfied but after some thought I decided that I wanted my launch daemon to do all of the heavy lifting; instead of having an enrollment policy install a script which calls another policy which calls more policies and scripts I decided to take out the middleman. Enrollment policy installs script which does everything else (runs policies and scripts). My final provisioning script ended up like this:

{% gist 225fc5e3793e00d5434a17adc451872c %}

If you choose to use the leaner script it will still work, just be sure whatever policy you call sets up DEPNotify.

### Putting it All Together

The next task was getting the program and scripts on the system at enrollment, since my last post was basically doing this in a different method it was simple to accomplish. I used Jamf Composer to build a package to drop DEPNotify, my logo file, my launch daemon, and my script, then launch the launch daemon when done.

|[![Composer with all scripts and files placed.](/wp-content/uploads/2018/05/Screen-Shot-2018-05-10-at-3.16.54-PM.png?resize=648%2C469&ssl=1)](/wp-content/uploads/2018/05/Screen-Shot-2018-05-10-at-3.16.54-PM.png?ssl=1)|
|:--:|
|Composer with all scripts and files placed.|

Make sure all of your file owners and groups are correct (everything is basically root:wheel) and be sure the permissions are correct (644 seems to work fine). And finally, the postinstall script for that package.

{% gist 71b1ed9986e8503c5938919fffca6399 %}

While lines 18-32 are the only ones needed I really like to have the rest. They temporarily change some settings so that if the person setting up the machine (in our case, the techs) decide to let the laptop sit for a while before deploying or if they close the lid/shutdown updates don’t try to run.

Build the package, set it to run with an “Enrollment” trigger on your appropriate Pre-stage enrollment machines and you should be off to the races.

While testing this method the DEPNotify GUI always comes up (even with waiting at weird times) and the deployment policy I have never runs until the user is fully logged in. Would I say this will work every single time? No, because there will always be an edge case, but so far it’s been working for us perfectly.

In order for us to move forward with a more “unattended” DEP deployment I’m going to work on a process that will create a user that will automatically log in (probably using [pyCreateUserpkg](https://github.com/gregneagle/pycreateuserpkg)), reboot then launch the launch daemon without user input. This will probably happen within the next few weeks and hopefully I’ll have another updated post!

You can find all of the scripts I use with DEPNotify on my [Git](https://github.com/jmahlman/Mac-Admin-Scripts/tree/master/UArts%20Scripts%20(Archived)/tree/master/DEP%20Scripts). That folder also includes my original script from the last post as well as my “assign and rename” script.

#### Notes

- Thanks to @techgrltweeter in the Mac Admins slack for some of her suggestions with the postinstall script and launch daemon
- Thanks to everyone in the #depnotify channel also, you are all awesome!
