---
id: 721
title: 'Automatically match Parallels VM to Mac name'
date: '2016-04-20T11:37:59-05:00'
author: 'John Mahlman IV'
excerpt: "Having Parallels in your environment is great, unfortunately some issues come into play when you're trying to push out a customized VM to your users. \_One of the problems we ran into was the name of the machine; if you're pushing out one VM image you're going to see tons of duplicate names on your network. \_What if you could change the VM name to the name of the host without having to worry about asking the user to do it? \_Well, that was a task I was given and I feel that I resolved it successfully. \_This was all tested with Parallels Desktop 11 and a\_Windows 10 Professional VM.\r\n\r\nUsing a few scripts (which can be found <a href=\"https://github.com/jmahlman/Mac-Admin-Scripts/tree/master/UArts%20Scripts%20(Archived)/tree/master/Rename%20Parallels%20VM\" target=\"_blank\" rel=\"noopener\">here</a>) you can accomplish this fairly easily.\r\n"
layout: post
guid: 'http://yearofthegeek.net/?p=721'
permalink: /2016/04/auto-match-parallels-vm-to-mac-name/
dsq_thread_id:
    - '4762801967'
categories:
    - Guides
tags:
    - guide
    - parallels
    - script
---

Having Parallels in your environment is great, unfortunately some issues come into play when you’re trying to push out a customized VM to your users. One of the problems we ran into was the name of the machine; if you’re pushing out one VM image you’re going to see tons of duplicate names on your network. What if you could change the VM name to the name of the host without having to worry about asking the user to do it? Well, that was a task I was given and I feel that I resolved it successfully. This was all tested with Parallels Desktop 11 and a Windows 10 Professional VM.

Using a few scripts (which can be found [here](https://github.com/jmahlman/Mac-Admin-Scripts/tree/master/UArts%20Scripts%20(Archived)/tree/master/Rename%20Parallels%20VM)) you can accomplish this fairly easily.

First, you need to get your VM set up properly. Make sure your VM had at least two accounts; an admin and a standard user (unless you don’t care if your end-users are admins). Log in to the user you will want your end-users to use to make sure that initial account creation is completed. Next, set your admin user to [auto-login](http://www.intowindows.com/how-to-automatically-login-in-windows-10/) and get your Windows environment set up the way you want it with your applications, updates, and activation. Also make sure that you give your VM access to ‘/Users/Shared/’ on your host Mac, you’ll see why later.

Once you have it all ready, you have to drop some scripts into ‘C:\\Users\\Public\\’. The first script is a PowerShell script:

{% gist 68127c295010a8d1b514c1ca34231e02 %}

This script takes the name from a file which we will create on the host machine and rename the machine to **vm-*machostname***. This PowerShell script gets called by a simple batch file which is also placed in ‘C:\\Users\\Public\\’:

{% gist 7ae85a6f5cd0537e18faf5024ac7dd43 %}

Finally, you have to place the auto-login batch file in ‘C:\\Users\\Public’:

{% gist 62da766888e605246d50146c4a24dc7c %}

Now that you have the scripts in place, we want to run them on the next boot but only one time. Thankfully we have our handy **RunOnce** registry key. So, I just made a quick *.reg* file to add the batch file to the **RunOnce** key:

{% gist 9ab777236ec12c60c1473019178cafe2 %}

So, when you’re ready to package your VM, just run the reg file and shutdown your VM. Make sure you don’t boot this VM again because the next time it boots you will see that it runs the batch script which calls our PowerShell script which will set the computer name, set the standard user to automatically login then reboot the system.

Now the fun part, getting it to happen for the end-user! Package your VM and Parallels (or whichever program you’re using) and put it on your distribution server along with this bash script:

{% gist f4b34c0e3447387c12676e9bfe7bdeca %}

Pretty self explanatory, the script gets the hostname of the computer and drops it into ‘/Users/Shared/hostname’. Note that this script does truncate your hostame if it’s too long for a NetBIOS name; since “vm-” takes 3 chars away your name would be shortened to 12 characters. This file will be read by the Windows scripts and this is how your VM gets the host computer name.

When you’re pushing out the package with Casper Suite just have the script run before your install.

|[![What it looks like at first login.](/wp-content/uploads/2016/04/rename-anim-1024x624.gif?resize=648%2C395)](/wp-content/uploads/2016/04/rename-anim.gif)|
|:--:|
|What it looks like at first login.|

I’m always open to suggestions on making my code better, drop them in the comments!
