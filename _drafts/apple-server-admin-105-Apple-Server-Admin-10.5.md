---
id: 55
title: 'Apple Server Admin 10.5'
date: '2008-11-11T14:05:58-05:00'
author: 'John Mahlman IV'
layout: post

permalink: /2008/11/apple-server-admin-105/
dsq_thread_id:
    - '28244112'
ngcp_type:
    - opinion
categories:
    - Technology
    - Uncategorized
tags:
    - servers
    - Technology
---

As I wrote [before](yearofthegeek.net/?p=37), I use Apple servers at work and most times I enjoy using them. I feel that the operating system is very stable (I happen to use 10.4.1 and 10.5.5) and very customizable, and i also feel that the hardware is very good. It’s <span style="text-decoration: underline;">very</span> rare that I see the CPUs being pegged or the memory getting drained somehow.

Our secondary server, POW, the server that this site is currently hosted on hosts a few different domains. Recently, I have been setting up things for our new HCI and Games lab here at BXMC. They wanted a site so they made one in WordPress with my recommendation. Now I need to move it to the server with a better domain than pow.idmi.poly.edu/~chrisdimauro/wordpress. I was instructed to use socialgamelab.bxmc.poly.edu (the bxmc is due to the expected change in all of our domains soon). I call up my guy at IS and he tells me it’s done. Excellent for me.

Now the task of setting up another virtual host on POW. Normally this is a CLI job with lots of files and configuration but not with Server Admin (SA); SA gives you a really nice GUI for editing many server features. One can completely configure and maintain their server without ever using CLI by using SA. More complex set-ups will have difficulty at times while only using SA.

This is what you’re presented with after opening SA, a very nice looking summary of your server and it’s running processes.

![ServerAdmin_1](https://i2.wp.com/yearofthegeek.net/wp-content/uploads/2008/11/serveradmin-1.png?w=648)

Now, I want to add a new website to this server using a name-based virtual host. So I’ll select ‘Web’ from the left side list of active services, and begin to edit this:

![Picture 1.png](https://i2.wp.com/yearofthegeek.net/wp-content/uploads/2008/11/picture-1.png?w=648)

That’s a very simple, straight-forward form for a website. I filled out all of the appropriate information, pointed everything to the proper directory, and save. I restart apache, and try the site after a few (i needed to wait for it to replicate to the external dns servers). After a short wait, I test the site. I am directed to the main site, pow.idmi.poly.edu. Something is not working on my end, I don’t think virtual hosting is working properly. So I test one of our other virtual hosts on the server, and that works. I compare the two, both are the same 100%. Now it’s time to bring out the CLI and go deeper into the config files.

Apparently Leopard server uses different configuration for virtual hosts and apache in general. It breaks up each virtual host config file into numbered .conf files. Apache’s httpd.conf just includes the directory and any .conf files that are inside of that directory. Sure, this looks nice, it’s pretty clean and easy to edit sites, but it’s a pain when researching help, I am literally stuck with Apple only help (to a good extent). I find the appropriate file (nicely named 0005\_\[ip\]\_socialgamelab.bxmc.poly.edu.conf) and look into the file. I compare it with the working virtual hosts .conf file and find, they’re also the same.

Now I begin to ask myself things like “Why?” and “What?” but at the same time begin to wonder how Leopard Server is messing this up. The site loads properly if I direct the browser to it’s long directory, but still only gives me the main site if I use the new virtual host name.

I am still in the process of working on getting this to work. I have a list made up of how I am going to resolve this. I think I will update as I go through the list.

1. Comb the internet for help, this includes Apple discussion forums, and of course Google.
2. Change the bxmc to idmi. This could be conflicting on our network which is still using idmi for everything else.
3. Call Apple Support. When you buy Apple server products, like every other server retailer, you get support. We have support for our recently purchased Mac OS 10.5 Server, I will utilize this to it’s fullest extent.
4. Replace the entire apache configuration with a default configuration from another system that works. Last resort because I really do not want to re-configure the webserver.

**Covering the List**

1. I have been searching the internet and Apple discussion boards for hours (before I wrote this post). I found one issue with domain aliases using an (\*) in place of a real alias, but nothing that fixed the problem yet.
2. IS has changed it to IDMI a little while ago, I’m waiting for it to update. Let’s hope this is the last step.