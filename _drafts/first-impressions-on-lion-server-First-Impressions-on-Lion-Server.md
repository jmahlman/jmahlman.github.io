---
id: 489
title: 'First Impressions on Lion Server'
date: '2012-02-15T15:16:22-05:00'
author: 'John Mahlman IV'
excerpt: 'I like Lion as s desktop, I haven''t had any issues with it thus far, but I really dislike Lion Server. Initial server setup was also very simple; it asks a few questions, configures some services for you, and you''re done.  After it drops you into the desktop, you''re on your own.  So manage the server in the past you had a few tools; Server Admin, the main config GUI for all services; Workgroup Manager, to configure users and computers on the network; and Server Monitor, a simple monitoring tool that gives you the server status at a glance.  Lion includes those tools with the addition of one more: Server.  Server is basically what separates Lion desktop from Lion Server, one single app to "control" the services.  This sounds great, but wasn''t that what Server Admin was for?  Yes..it was.  But now Apple decided that they wanted to make things more difficult and separate configurations into two programs, one of which (Server) is stupidly over simplified.'
layout: post

permalink: /2012/02/first-impressions-on-lion-server/
aktt_notify_twitter:
    - 'yes'
aktt_tweeted:
    - '1'
dsq_thread_id:
    - '577431257'
ngcp_type:
    - opinion
ngcp_sync:
    - '1'
categories:
    - Hardware
    - Rant
    - Reviews
    - Software
    - Uncategorized
---

I haven’t forgotten about the posts on upgrading my servers, I’ve just not had the time to. I also got extremely delayed with getting the hardware itself. Let me just give some first impressions on Lion server and the new hardware.

## Hardware

The Mac Mini servers are very fast, quiet, and easy to store of course. The Promise Pegasus is a great piece of hardware also. Six SATA drives in a box smaller than a mini tower with a single cable for data. Setting up the hardware was so simple it’s only one sentence: Take out of box, configure, plug in Promise, done.

## Software

Now on to the bad part; Lion Server. I like Lion as s desktop, I haven’t had any issues with it thus far, but I really dislike Lion Server. Initial server setup was also very simple; it asks a few questions, configures some services for you, and you’re done. After it drops you into the desktop, you’re on your own. So manage the server in the past you had a few tools; Server Admin, the main config GUI for all services; Workgroup Manager, to configure users and computers on the network; and Server Monitor, a simple monitoring tool that gives you the server status at a glance. Lion includes those tools with the addition of one more: Server. Server is basically what separates Lion desktop from Lion Server, one single app to “control” the services. This sounds great, but wasn’t that what Server Admin was for? Yes..it was. But now Apple decided that they wanted to make things more difficult and separate configurations into two programs, one of which (Server) is stupidly over simplified.

### Server vs Server Admin

Server is basically a simplified version of Server Admin. When I say simplified I mean VERY simplified.

<figure class="thumbnail wp-caption aligncenter" id="attachment_496" style="width: 432px">[![](https://i1.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Screen-Shot-2012-02-15-at-12.17.01-PM.png?resize=422%2C312 "Server.app Overview")](https://i1.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Screen-Shot-2012-02-15-at-12.17.01-PM.png)<figcaption class="caption wp-caption-text">Looks good, but wait until you go in more...</figcaption></figure>Now, compare that to the old Server Admin overview shown below.

<figure class="thumbnail wp-caption aligncenter" id="attachment_498" style="width: 404px">[![](https://i0.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Screen-Shot-2012-02-15-at-12.21.13-PM.png?resize=394%2C363 "Server Admin.app")](https://i0.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Screen-Shot-2012-02-15-at-12.21.13-PM.png)<figcaption class="caption wp-caption-text">Looks similar....but...</figcaption></figure>Now these two look like they give relatively the same information, right? It tells you everything you need to know about the sevrer at a glance. If you notice that on Server you have a lot more items on the sidebar though, and Server Admin has very little. This is because Server Admin allows you to select what you want shown, so out of the many options (there are 11 total) I only need to show those 3; however, out of those 11, only 2 are available in Server also (Mail and Podcast Producer). Why is this a problem? Server Admin allows you to really edit lots of different settings with your services, it also allows you to edit more advanced services (DHCP, NAT, DNS). Server allows you to edit the most used services (file sharing and web) but they are VERY limited in what you can edit.

For example, editing file sharing on anything other than 10.7 looked like this in Server Admin before:

<figure class="thumbnail wp-caption aligncenter" id="attachment_499" style="width: 310px">[![](https://i0.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Picture-1-300x235.png?resize=300%2C235 "File Sharing Conf")](https://i1.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Picture-1.png)<figcaption class="caption wp-caption-text">10.5 File Sharing</figcaption></figure>This window gave you everything you needed to set up proper file sharing with users, home directories, NFS, FTP, SMB, AFP, and a bunch of other things. It gives you great control over your network file system and user access. This is what you get with Server:

<figure class="thumbnail wp-caption aligncenter" id="attachment_501" style="width: 310px">[![](https://i2.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Screen-Shot-2012-02-15-at-12.17.55-PM-300x221.png?resize=300%2C221 "Lion File Sharing")](https://i1.wp.com/yearofthegeek.net/wp-content/uploads/2012/02/Screen-Shot-2012-02-15-at-12.17.55-PM.png)<figcaption class="caption wp-caption-text">10.7 File Sharing Configuration</figcaption></figure>That’s it. Those are your settings you can edit. Notice the lack of FTP and NFS…as well as lack of a REAL permissions editor. This is totally unacceptable in a server environment. NFS is still there (it gets enabled when you use NetBoot) but where is FTP? it’s not in Server or Server Admin. Well, Apple decided FTP isn’t needed really, and basically removed it. Let me rephrase, they didn’t REMOVE it completely, it’s hidden. Apple’s basic FTP server is still there, but there are not settings in GUI for it at all, it’s all command based now, and to enable it you have to type this command in terminal.

`sudo launchctl load /System/Library/LaunchDaemons/ftp.plist`

Now, on a server, that’s pretty ridiculous, especially since FTP config was easy and clean in pervious versions of OS X Server. To get around using the basic FTP, which has limited functionality, I decided to install a third-party server. I will make another post on how I accomplished this and about the frustrations I had with it. Long story short, went with PureFTP.

My frustrations with LDAP also came back. I’m not sure if it’s an issue with our old LDAP database or setup, but I simply couldn’t restore the server LDAP backup for the life of me. I tried several different methods but nothing worked. I ended up exporting user data (without the passwords) to the new server using Workgroup manager. This worked fine, but I lost every password. I was upset with this, but I knew it was the best method to try to get the LDAP working normally again (I constantly have trouble with the old LDAP server due to corruption…so this hopefully would fix that). The user editing in Server is horrible. It’s way too simplified, and doesn’t allow much configuration..thankfully, you can use Workgroup manager still.

After setting up a new image and setting shares for home directories and resetting passwords, I tested our lab with home directories and logins and SUCCESS! It all worked! So now the network accounts are faster, and the LDAP seems to be working fine now.

Moral: Lion Server sucks compared to older versions.

I’ll be updating again on how I got PureFTP installed on the server and configure it for LDAP. I’ll also go over how I got SFTP working with users jailed to their home directories….but breaking AFP, then fixing it again.