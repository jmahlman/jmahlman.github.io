---
id: 774
title: 'Setting up a Customized Backburner Render Farm on your Macs'
date: '2016-11-17T13:20:50-05:00'
author: john
excerpt: "Does anyone remember <a href=\"https://en.wikipedia.org/wiki/Xgrid\">Xgrid</a>? \_How about <a href=\"https://en.wikipedia.org/wiki/Apple_Qmaster\">Qmaster</a>? I do! \_If you don't, check out those links and come back. \_TL;DR: Apple made distributed rendering (relatively) easy to configure and Xgrid was particularly great because it was built into Mac OS. \_Apple was making headway for some easy\_distributed rendering for use with their pro software and hardware. \_Unfortunately, Apple hasn't been kind to their professional line; I believe Qmaster lives on in Compressor but most traces\_of Xgrid at least are all but gone. \_When I was working at (what was then) NYUPoly I managed a small Mac lab and set up a very basic Xgrid system with our 15 machines and it worked, one time.\r\n\r\nSo when we were asked if a distributed rendering system (or render farm) for Maya (and possibly others) was something that can be done here at UArts\_I thought \"Oh fun! \_I can spend countless hours on this again and have one person use it!\" \_To my surprise, I only spent a\_<em>few</em> hours looking into this and managed to get a proof of concept working with Autodesk Backburner 2017 and Maya 2017."
image: /assets/uploads/2016/11/backburner-server-list-populated.png
categories: [Guides]
tags: [autodesk, backburner, Maya, scripts, render farm]
---

Does anyone remember [Xgrid](https://en.wikipedia.org/wiki/Xgrid)? How about [Qmaster](https://en.wikipedia.org/wiki/Apple_Qmaster)? I do! If you don’t, check out those links and come back. TL;DR: Apple made distributed rendering (relatively) easy to configure and Xgrid was particularly great because it was built into Mac OS. Apple was making headway for some easy distributed rendering for use with their pro software and hardware. Unfortunately, Apple hasn’t been kind to their professional line; I believe Qmaster lives on in Compressor but most traces of Xgrid at least are all but gone. When I was working at (what was then) NYUPoly I managed a small Mac lab and set up a very basic Xgrid system with our 15 machines and it worked, one time (It only worked once because only one person *wanted* to use it. Then it kind of just fizzled away).

So when we were asked if a distributed rendering system (or render farm) for Maya (and possibly others) was something that can be done here at UArts I thought “Oh fun! I can spend countless hours on this again and have one person use it!” To my surprise, I only spent a *few* hours looking into this and managed to get a proof of concept working with Autodesk Backburner 2017 and Maya 2017.

So, the first thing we really needed to do was find what solutions were available. Not knowing the budget they had in mind we looked into paid options and “free” options. We looked at [Qube!](http://www.pipelinefx.com/) by PipelineFX, which offers pretty good pricing for education and seems to be a leading product in the render management field (It says so on their website and logo!), but going with them would require a lot more time, money, and training which we don’t have time for at the moment (we were given about 2 weeks notice for suggestions/information). Again, not knowing a budget for this we put Qube! on the shelf and looked into [Backburner](https://knowledge.autodesk.com/support/3ds-max/troubleshooting/caas/CloudHelp/cloudhelp/2017/ENU/Installation-3DSMax/files/GUID-F6732A30-821C-4547-9FAA-E46BCA13392A-htm.html), a product which we already have access to because we have subscriptions for a number of Autodesk applications.

## Basic Backburner Installation and Setup

We immediately found a huge problem with Backburner, the documentation from Autodesk was terrible. When we were able to find the [user and installation guides](https://knowledge.autodesk.com/support/3ds-max/troubleshooting/caas/sfdcarticles/sfdcarticles/Backburner-User-Guide-and-Installation-Guide-documents.html) they were for Backburner 2011, and reference programs which we don’t have and mainly explain the Windows installation/setup side. We decided to try to make sense of the documentation and configuration anyway, so we downloaded the packages needed for Backburner (there are actually several packages..more on that later) and install them to some test machines.

After installing the packages we navigated to *<http://localhost/Backburner>* on the system and we were given a web interface for managing the system.

|[![The Backburner webUI after installation.](/assets/uploads/2016/11/Jobs.png?resize=648%2C421&ssl=1)](/assets/uploads/2016/11/Jobs.png?ssl=1)|
|:--:|
|The Backburner webUI after installation.|

Obviously there were no jobs but we also didn’t see any of the other systems we installed the packages on with the exception of the “Manager” dropdown at the top, that seemed to propagate automatically.

|[![The list of available managers](/assets/uploads/2016/11/Server-List.png?resize=471%2C239&ssl=1)](/assets/uploads/2016/11/Server-List.png?ssl=1)|
|:--:|
|The list of available managers|

Let me take a second to clear up some Backburner terminology:

- Server: a render node…this confused me at first
- Manager: a system that manages jobs and server groups
- Monitor: a system with the WebUI installed that allows you to manage your render farm(s), you can choose which manager to work with (as shown in the image above)

Any of combination of these components can be installed on any one system at a time; however, it’s not recommended that a manager be a server due to the amount of work a manager will end up doing when jobs are active.

Our next step was to connect multiple machines into a single server group on one manager. Looking at the install guide, Autodesk tells us to add the hostname of the manager to the following file: */usr/discreet/Backburner/cfg/manager.host* but this isn’t true for 2017. Inside the *cfg* folder is a README file that contains the following:

```text
 Important Note: the manager.host file is now obsolete.
 To connect the Backburner Server to a remote Manager, run the
 following two commands in a Terminal with administrator privileges:
 /usr/discreet/Backburner/BackburnerServer -m <mgr>
 /usr/discreet/Backburner/Backburner_server restart
 where <mgr> is the name or ip of the Manager's host.
 ```

Well, that is actually very useful! So I run the commands and lo-and-behold it works! The computer shows up in my server tab in the webUI and I can see details of the servers by double clicking them.

|[![Our fully populated server list](/assets/uploads/2016/11/backburner-server-list-populated.png?resize=648%2C421&ssl=1)](/assets/uploads/2016/11/backburner-server-list-populated.png?ssl=1)|
|:--:|
|Our fully populated server list|

The next step was to make them work as one unit, this is where we create a new “Server Group” and add the machines to the group.

|[![Adding servers to a group](/assets/uploads/2016/11/backburner-edit-server-group.png?resize=648%2C421&ssl=1)](/assets/uploads/2016/11/backburner-edit-server-group.png?ssl=1)|
|:--:|
|Adding servers to a group|

Once the servers are in a group you’re basically ready to send jobs to your render farm. Make sure you have Maya installed on all of your render servers of course.

## Customizing the Setup

I’m not going to go into how to set your Maya project up for proper rendering (that’s the designer/artists job) but it must be set up properly. However, even if your project is set up properly, every computer needs to have access to the project files and the only way to do this is to use a shared folder that every computer can access, and the share needs to be readily accessible on the systems, Maya will not mount the shares for you. You can accomplish this is a number of ways of course but we wanted everything to be done with a single package and have the share always available. We also didn’t want to advertise the share to all users so we decided to use auto\_master to mount a public share:

```bash
# make local "server" directory
SERVERDIR="/macsvr1"
if [ ! -e ${SERVERDIR} ]; then
	mkdir ${SERVERDIR}
	mkdir ${SERVERDIR}/Backburner
	chmod -R 777 ${SERVERDIR}
else
	echo "${SERVERDIR} already exsits, skipping."
fi

# add smb mount to auto_master
AUTOMASTER="/etc/auto_master"
if [ "$(grep "auto_smb" $AUTOMASTER)" != "/-	auto_smb" ]; then
	echo "Adding auto_smb to ${AUTOMASTER}"
	echo "/-	auto_smb" >> $AUTOMASTER
else
	echo "auto_smb exists in ${AUTOMASTER}. Skipping auto_master setup."
fi

# create auto_smb file
AUTOSMB="/etc/auto_smb"
if [ ! -f ${AUTOSMB} ]; then
	echo "Generating ${AUTOSMB}"
	touch ${AUTOSMB}	
 	echo "/macsvr1/Backburner -fstype=smbfs ://guest@macsvr1/Backburner" > $AUTOSMB
	# re-check mounts
  	automount -vc
else
  echo "Skipping generation of ${AUTOSMB}. Already exists."
fi
```

What I’m doing is creating a directory in my root folder (I’m just using the server name) and mounting the share **at startup** to that folder. This allows us to allow rendering without having to log in to a system and also hides the share from the desktop easily enough.

Since I wanted to make a single package that installs Backburner, points each server to a single manager, and mounts the share I used [Packages](http://s.sudre.free.fr/Software/Packages/about.html) to bundle the Backburner package from Autodesk and my full script:

```bash
#!/bin/bash

# This script is used to install backburner and create our automount for network directory


# Determine working directory

install_dir=`dirname $0`

# Install backburner

/usr/sbin/installer -dumplog -verbose -pkg $install_dir/"backburner-2017.0.0-2224.i386.pkg" -target "$3"

/usr/discreet/backburner/backburnerServer -m macsvr1
/usr/discreet/backburner/backburner_server restart

# make local "server" directory
SERVERDIR="/macsvr1"
if [ ! -e ${SERVERDIR} ]; then
	mkdir ${SERVERDIR}
	mkdir ${SERVERDIR}/Backburner
	chmod -R 777 ${SERVERDIR}
else
	echo "${SERVERDIR} already exsits, skipping."
fi

# add smb mount to auto_master
AUTOMASTER="/etc/auto_master"
if [ "$(grep "auto_smb" $AUTOMASTER)" != "/-	auto_smb" ]; then
	echo "Adding auto_smb to ${AUTOMASTER}"
	echo "/-	auto_smb" >> $AUTOMASTER
else
	echo "auto_smb exists in ${AUTOMASTER}. Skipping auto_master setup."
fi

# create auto_smb file
AUTOSMB="/etc/auto_smb"
if [ ! -f ${AUTOSMB} ]; then
	echo "Generating ${AUTOSMB}"
	touch ${AUTOSMB}	
 	echo "/macsvr1/Backburner -fstype=smbfs ://guest@macsvr1/Backburner" > $AUTOSMB
	# re-check mounts
  	automount -vc
else
  echo "Skipping generation of ${AUTOSMB}. Already exists."
fi
```
{: file='backburner-install-automount-server.sh'}

|[![Settings for creating my initial Backburner package in Packages](/assets/uploads/2016/11/backburner-packages-settings-1.png?resize=648%2C425&ssl=1)](/assets/uploads/2016/11/backburner-packages-settings-1.png?ssl=1)|
|:--:|
|Settings for creating my initial Backburner package in Packages|

Note lines 14 and 15, look familiar? Also take note that the post-install script and the Backburner package is set as “Relative to Project” instead of “Absolute Path.” This will allow you to push everything out as needed to your systems and have a working Backburner render farm in a few minutes.

When you install Backburner on a machine, another service will be installed in addition to the Backburner server; the manager. This is something we did not want to happen on nodes, so I wanted to remove those from the Autodesk Backburner package using Composer.

|[![We removed the files marked with red dots](/assets/uploads/2016/11/backburner-defaultPackage-marked.png?resize=648%2C516&ssl=1)](/assets/uploads/2016/11/backburner-defaultPackage-marked.png?ssl=1)|
|:--:|
|We removed the files marked with red dots|

Loading the package into Composer had the adverse effect of changing permissions on all of the files in the /usr/discreet and /usr/lib32 folders (you can see in the image what the permissions are…they’re wrong). So I changed the permissions to the appropriate settings (755). But, before I build the package I want to go into one more bit because it’s going to be needed in the package.

Because we didn’t know the budget we assumed that those asking for this setup would be using already existing hardware (basically lab machines that get used by people randomly) or if they were going to use dedicated machines. Of course the latter would be much easier to manage; we wouldn’t have to worry about users restarting machines or unplugging cables, etc. Also, if dedicated hardware was going to be used, we already knew how it would work. However, we were almost 100% certain that lab machines would want to be used so we had to test a few things.

The first thing we wanted to test was what happens if a machine is rebooted or shutdown by a user gracefully. We found that a shutdown will cause the render server (the computer) to tell the manager that the server was shutting down and the manager will parse the jobs out to other machines properly. However, when we tested a reboot we found a very big issue. The server would send the manager the notification that it was shutting down and the jobs that were queued on the server would get sent to other machines as expected; however, at startup the system hung and never booted, it say at the progress bar and Apple. When we checked the manager we noticed that the server was marked as “Active” which means that a job is currently processing on it, we of course knew this was a problem. It seemed like the Backburner launch daemon was starting as soon as possible on boot, which wouldn’t be a problem typically but when you have a render job going it’s going to try to render when the server is marked as available on the manager, Backburner manager doesn’t seem like it’s smart enough to know when a computer is booting or doing other tasks.

In order to stop this from happening (and hanging any systems that get rebooted when rendering) I had to delay the startup of Backburner.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>KeepAlive</key>
	<dict>
		<key>PathState</key>
		<dict>
			<key>/usr/discreet/backburner/nrapi.conf</key>
			<true/>
		</dict>
	</dict>
	<key>Label</key>
	<string>com.autodesk.backburner_server</string>
	<key>ProgramArguments</key>
	<array>
		<string>/usr/discreet/backburner/backburnerServer</string>
	</array>
	<key>Nice</key>
	<integer>18</integer>
</dict>
</plist>
```
{: file='com.autodesk.backburner_server.plist'}

That there is the launch daemon plist that gets installed with Backburner. I wanted to add a delayed start in there so I just added a middle-man:

```bash
#!/bin/sh

sleep 60

/usr/discreet/backburner/backburnerServer
```
{: file='delayBackburnerServer.sh'}

I put that script in**/usr/discreet/backburner** and named it **delayBackburnerServer**. It is called by the launch daemon instead of **/usr/discreet/backburner/backburnerServer**. So now my com.autodesk.backburner\_server.plist looks like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>KeepAlive</key>
	<dict>
		<key>PathState</key>
		<dict>
			<key>/usr/discreet/backburner/nrapi.conf</key>
			<true/>
		</dict>
	</dict>
	<key>Label</key>
	<string>com.autodesk.backburner_server</string>
	<key>ProgramArguments</key>
	<array>
		<string>/usr/discreet/backburner/delayBackburnerServer</string>
	</array>
	<key>Nice</key>
	<integer>18</integer>
</dict>
</plist>
```
{: file='CUSTOM-com.autodesk.backburner_server.plist'}

We ran the reboot test again and the hanging boot went away. So that simple solution worked well and we decided to add the edited file and the delay script to the install package. So now our package looks like this:

|[![Our Backburner install package in Composer](/assets/uploads/2016/11/backburner-customPackage.png?resize=648%2C514&ssl=1)](/assets/uploads/2016/11/backburner-customPackage.png?ssl=1)|
|:--:|
|Our Backburner install package in Composer|

Now that we have a customized install package, we can use this one in our Packages project and build it out and install on systems.
