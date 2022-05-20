---
id: 266
title: 'Issues with WiFi and Vista'
date: '2009-09-18T12:48:20-05:00'
author: 'John Mahlman IV'
layout: post

permalink: /2009/09/issues-with-wifi-and-vista/
aktt_notify_twitter:
    - 'yes'
aktt_tweeted:
    - '1'
dsq_thread_id:
    - '34961670'
ngcp_type:
    - opinion
categories:
    - Hardware
    - Rant
    - Software
tags:
    - incompetence
    - stupid
    - vistasucks
    - windows
    - wireless
---

In my lab I keep a wireless access point active; mainly for students and profs using it to connect computer together for whatever. I used to use a WPA password for the system. WPA worked fine except that many people who were not supposed to be on the network were on there. Students would give the password out, and this annoyed me. That network is supposed to be for DM staff and students only, that’s why I have it separate from the schools wireless.

Over the summer I made a lot of changes to the network, mainly I changed it over to use WPA2 Enterprise with our RADIUS server. The logins are taken from our Open Directory LDAP (the ones people use to log into our machines, website, wiki, etc.) and thats how people connect. Works great in MacOS, I select the network, put my user and pass in and voila! Windows was another story.

My MBP has Windows 7 Ultimate; I was able to connect to the network after changing some WIndows defaults. It does ask for a login, which is better than what XP did, but it still had some issues. I had to disable the “Check server certificate against blah blah”, because it’s a self-signed cert it wouldn’t work. I also need to disable “Use windows login password to login to this network.” I understand most people using “enterprise” networks all use AD or whatever to login to their computer, but why make that default? Not to mention, to change both of these options it’s 5 levels down or so buried deep in the wireless preferences. It’s impossible to change if you don’t know what you’re doing.

Windows 7 connects fine now. No issues, it’s actually very stable. Issues arise when Vista users connect. Now, when I add the network for a Vista user it comes up as WPA2 Enterprise (good), AES (great), it even prompts for a user and password (excellent). No connection. I change those settings above again, because it’s by default, still nothing. I go into even more advances prefs by changing the authentication method to MSCHAPv2 or TTLS, PEAP, whatever works. Nothing works. I check all of the Vista prefs with my working Windows 7 prefs, they are identical. What is the issue then?

After a good Google search, and more and more searches, and stops to Apple discussions, and everything else I can think if, I see similar results. Apparently Windows Vista HOME does not work with WPA2 Enterprise. It just doesn’t work. It’s “broken” as some would put it, or “disabled.” Whatever the reason, my question is “Why??” Why do you put WPA2 Enterprise network prefs and even allow me to add said network to my computer when I can’t fucking connect to it? Explain that one, please! If you don’t want Home users to connect to enterprise networks, take the fucking thing out, don’t just make it act like it works and then not let it. How do I know it’s a client issue and not a server issue? Logs.

My server logs all RADIUS connections and attempts to authenticate. My server issues the challenge to the machine, but the machine apparently ignores it, or throws it away, or wipes its ass with it. It does NOTHING.

Now, I was having this issue with some other computers as well, Windows XP users. Their main issue was that they didn’t have updated drivers or settings were screwed up, but they eventually worked most of the time. I’ve also tried with some Vista Pro computers, and yes it works most of the time. The times it doesn’t usually work, I tell the people to get the software from their card manufacturer and use it, and then it seems to magically work.

What is wrong with WIndows wireless? You got me, but I finally told those people who couldn’t connect to either upgrade or deal with it and connect to a poly network. Hell, Poly’s putting N-Wireless in, I might just use it from now on also!