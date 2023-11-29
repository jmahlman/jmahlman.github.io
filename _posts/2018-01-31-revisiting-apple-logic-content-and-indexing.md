---
id: 849
title: 'Revisiting Apple Logic Content and Indexing'
date: '2018-01-31T15:17:54-05:00'
author: john
excerpt: "My post <a href=\"/posts/install-logic-pro-with-all-audio-indexed-using-casper-suite/\">Install Logic Pro with All Audio Indexed for All Users</a>\_has been the most clicked link on my blog from the last year. \_Granted, there are not many posts available but it always seems to be the one that I link to the most on Jamfnation and Slack.\r\n\r\nSince I posted that I've discovered a few things that will make life easier down the line for when imaging and NetBooting goes away completely; whenever that actually will happen is unknown but it will most likely be coming very soon if we are to take hints from the <a href=\"https://scriptingosx.com/2017/12/imac-pro-implications-for-mac-admins/\" target=\"_blank\" rel=\"noopener\">iMac Pro</a>. \_As a Mac admin, I'm very worried about this but I do believe that Apple will give us the tools needed to do massive, automated deployments. \_That question still has no really acceptable answer (internet recovery is a <i>bad</i>\_option) but I digress. \_Below I will outline the new method that we are using to deploy audio loops and indices that is more flexible and a little more future-friendly. \_<b>Please note that the method outlined in my last post will still work, but it's highly inflexible and requires a NetBoot in order to get receipts on the machine.</b>"
image: /assets/uploads/2018/01/Screen-Shot-2018-01-31-at-2.29.57-PM-2.png
categories: [Guides, Logic]
tags: [scripts, logic, update]
---

My post [Install Logic Pro with All Audio Indexed for All Users](/posts/install-logic-pro-with-all-audio-indexed-using-casper-suite/) has been the most clicked link on my blog from the last year. Granted, there are not many posts available but it always seems to be the one that I link to the most on Jamfnation and Slack.

|[![Screenshot of post visits over last year](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-1.51.14-PM.png?resize=648%2C344&ssl=1)](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-1.51.14-PM.png?ssl=1)|
|:--:|
|Definitely the most. The second one is the most of all-time, but also MUCH older and only has 300 or so more|

Since I posted that I’ve discovered a few things that will make life easier down the line for when imaging and NetBooting goes away completely; whenever that actually will happen is unknown but it will most likely be coming very soon if we are to take hints from the [iMac Pro](https://scriptingosx.com/2017/12/imac-pro-implications-for-mac-admins/). As a Mac admin, I’m very worried about this but I do believe that Apple will give us the tools needed to do massive, automated deployments. That question still has no really acceptable answer (internet recovery is a *bad* option) but I digress. Below I will outline the new method that we are using to deploy audio loops and indices that is more flexible and a little more future-friendly. **Please note that the method outlined in my last post will still work, but it’s highly inflexible and requires a NetBoot in order to get receipts on the machine.**

### *The* Script

While looking for other methods to get all of the loops installed in some labs quickly I came across a utility script called [AppleLoops](https://github.com/carlashley/appleLoops) by Carl Ashley. It’s a single Python script that does a whole lot of work. To borrow completely from the [wiki](https://github.com/carlashley/appleLoops/wiki): In the most basic sense, `appleLoops.py` simply processes the plist files that Apple uses to inform an app about what packages need to be downloaded and installed. There is a much more granular breakdown in that wiki if you’re interested.

The script has two modes:

- **Deployment** will download and install the loops packages based on your parameters or the installed apps based on found plist files in the `/Applications` folder. It performs a number of checks and installs only what is needed unload you specify it to force install everything
- **Download** allows you to simply download the packages to a folder which you can then use to push out in your preferred method

So technically, you don’t even need to use the script to install the loops, you can use it to gather them up and deploy however you’d like. As a system administrator, I want the most automated, simple method that can be repeated over and over again, so I decided to use it to deploy to my machines.

Deployment does another thing that is the reason I settled on using this script; it can create a local HTTP mirror! The basic process is to download the content using the `--mirror-paths` flag, and then upload this content to a local web server that can then be used when deploying content by specifying `--pkg-server` . This means that everything downloads via our internal network and we don’t have to keep pulling 60+ GBs over the internet.

### Preparation and Testing

The first thing I did was read through the [wiki](https://github.com/carlashley/appleLoops/wiki) to get a sense of what the script does and how to use every bit of it. I will not go over everything, but if you’re really interested in using the script (and you should be) definitely check out the wiki. I first tried it without a local mirror, just to see how it actually works; it’s a very simple script to use and the command I ran on a machine with Logic Pro and Garageband was `./appleLoops.py --dry-run --deployment -m -o` , the `--dry-run` flags just allows me to see what will be pulled and installed without actually doing it, the `-m` and `-o` arguments tell the script to download both **m**andatory and **o**ptional loops. It will go through a list of packages that will be installed and at the end tell you how much would be downloaded and installed. Very simple. I tried it once without the `--dry-run` flag and after a few hours it finished and I opened both apps and lo-and-behold, everything was installed.

After seeing it actually work, I decided to give local mirror creation a shot. I packaged up the script using jamf Composer, putting it in /usr/local/bin so I can invoke it quickly by just running `appleloops` from a terminal window (root owner, requires sudo). Now, you need a web server for this to work (internal only is fine and probably preferred) and enough space to store the packages, I currently have about 68GB downloaded. I didn’t want to run the appleloops script on the server itself (no real reason) so I decided to add a SMB share to one of our jamf share points called ‘appleloops’ and put it in an Apache accessible location. After mounting the share on a Mac I ran the following command:

`sudo appleloops --mirror-paths --apps garageband logicpro mainstage -d /Volumes/appleloops/ -m -o`

A few things; the `--apps` flag just tells the script which apps you want to get loop for, in my case I want all three apps it can deploy. The `-d` flag tells the script which directory we’re copying to, this is just copying to my mounted SMB share. After running this command every package that is available is downloaded to the server in a mirrored folder structure. Also, if there’s ever an update to the loops, if you run the same command again it will only download the packages that have been added or updated.

|[![loops dir screenshot](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-2.29.57-PM-2.png?resize=648%2C556&ssl=1)](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-2.29.57-PM-2.png?ssl=1)|
|:--:|
|This is what the directory looks like in Finder|

Now that I have the loops mirrored locally, I wanted to test installing them on a machine. I pushed out the appleloops package I created to get the script on a machine with GarageBand and I ran `appleloops --mute-progress-bar --deployment -m -o --pkg-server http://casperboot.ua.lan:8080/appleloops` from terminal and it worked there!

So now I decided to try to make it a little more flexible and try to streamline deployment for our labs. I wanted to have the machines make sure the script was available and install if it wasn’t, install the packages, and finally have the index for all users complete.

### Putting the Pieces Together

I already had the appleloops script package ready, now I just needed it to get on our machines when we decided to try to run it. I’m a fan of installing things only when needed, so I created a utility policy in our jamf server to just install the script when it was called:

- **Frequency**: ongoing
- **Trigger**: custom; apple-loops-installer
- **Scope**: All Computers
- **Packages**: our appleloops package

I then wrote a quick script that would do the work of checking for the script and installing if needed:

```bash
#!/bin/sh

if [ ! -f "/usr/local/bin/appleloops" ]; then
	echo "Installing Apple-Loops-Install script from JSS"
	/usr/local/jamf/bin/jamf policy -event apple-loops-installer
	caffeinate -i /usr/local/bin/appleloops --mute-progress-bar --deployment $4 --pkg-server http://url.to.folder/appleloops
	if [ ! -f "/usr/local/bin/appleloops" ]; then # Did the install work?
		echo "Unable to install Apple-Loops-Install script, aborting!"
		exit 1
	fi
else
    caffeinate -i /usr/local/bin/appleloops --mute-progress-bar --deployment $4 --pkg-server http://url.to.folder/appleloops
fi
```
{: file='appleloops-install.sh'}

What the script also allows for is customization of what loops to install. The `$4` parameter allows me to specify if I want the mandatory packages, the optional packages, or both by adding -m, -o, or -m -o to my script parameters in jamf.

Now that the appleloops script is ready for deployment, we need to get the index put together. For this, we follow my [previous posts](/posts/install-logic-pro-with-all-audio-indexed-using-casper-suite/) instructions (Note: My previous post was written for Logic Pro version 10.2.2, this post is written for 10.4, the basic steps should be the same):

> In order to get the index, load up Composer and grab a “New &amp; Modified Snapshot.” Once you have Composer waiting, open Logic and get to the main window by creating a new empty project. Go to **View** and select **Show Apple Loops** (Logic version 10.4 is Show Loop Browser) from the menu. In the Apple Loops sidebar click at the top where it says “Loops” (Logic version. 10.4 says “Loop Packs”) and go all the way to the bottom and hit “Reindex all Loops.” When that’s complete, close Logic (do not save the project), open GarageBand, and repeat the process there. After you reindex both programs and quit them simply return to Composer and complete the snapshot.

My snapshot ended up looking like this, please note the ~/Library/Keychains folder that is highlighted again, this is 100% necessary and it may not get captured automatically:

|[![Screenshot of composer window showing files and folders expanded.](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-3.00.50-PM.png?resize=648%2C469&ssl=1)](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-3.00.50-PM.png?ssl=1)|
|:--:|
|Your snapshot should look something like this, many folders are still collapsed here.|

Same statement as my previous post; am I 100% certain that every single one of these files is needed for an index? Nope. But these are the files that I have in my package and I have found this to work every time I push out my package. Once you have this, build it as a DMG because you’re going to have to use this to fill user templates and fill existing users in your jamf pro server.

Once the index package is created, you’re ready to deploy your apps and all loops! If you make a policy; install your apps first, then the index package, then run your loops script. You can also install everything at image time, just have the loops script run during your first run/reboot.

Depending on your hardware and your server bandwidth this process will take much longer than the previous method I outlined; this is because it’s actually installing every package one by one and not doing a block copy.

I have also tested this with GarageBand only and the process is basically the same, you will capture less during the indexing:

|[![Screenshot of Garageband Index only](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-3.10.44-PM.png?resize=648%2C469&ssl=1)](/assets/uploads/2018/01/Screen-Shot-2018-01-31-at-3.10.44-PM.png?ssl=1)|
|:--:|
|Again, note the Keychains folder|

So, closing out this post, I hope that I have helped people out of this annoying conundrum that Apple has created. I want to send out a huge thank you to [Carl Ashley](https://github.com/carlashley) for creating this amazing utility script and for saving me tons of headaches. If I ever meet you, I owe you a beer.

Notice a typo? Need clarification or have a question about the process? Drop a comment, I typically answer very quickly.
