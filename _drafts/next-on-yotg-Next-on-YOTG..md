---
id: 483
title: 'Next, on YOTG.'
date: '2011-11-15T15:04:12-05:00'
author: 'John Mahlman IV'
excerpt: 'It has finally happened.  My lab has finally gotten the funds to upgrade our aging G5 servers with nice, new, shiny Mac Mini''s and a Promise Pegasus RAID.  '
layout: post

permalink: /2011/11/next-on-yotg/
aktt_notify_twitter:
    - 'yes'
aktt_tweeted:
    - '1'
dsq_thread_id:
    - '473042707'
ngcp_type:
    - opinion
categories:
    - Hardware
    - Work
tags:
    - apple
    - Hardware
    - 'new purchase'
    - raid
    - xserve
---

It has finally happened. My lab has finally gotten the funds to upgrade our aging G5 servers with nice, new, shiny Mac Mini’s and a Promise Pegasus RAID.

Currently, [the lab I run](http://bxmc.poly.edu "BxMC") has 10 Mac Pro desktop’s all running into a 6 year old G5 Xserve and Apple RAID. The RAID uses 14 IDE drives that are basically maxed out. We have about 4TB of storage on 14 drives..this is very sad. Our G5 servers are not upgradable anymore, and we have limitations on the types of things we can serve on them. They have lasted us this long, but it’s time to finally phase them out.

In the next 2-3 weeks I’ll be replacing our two G5 servers and our RAID with two Mac Mini servers and the Promise Thunderbolt RAID. The servers will give us huge boost in performance and the RAID will bump us to 12TB of storage. This will not be an easy task as our current systems all run 10.5 and the new servers run 10.7. I will also have to migrate all of the user accounts and data to the new system without losing anything. Instead of removing our old servers I will use them only as basic servers; MySQL, Apache, Xgrid controllers, etc. I’m also going to use them as tertiary backups for our user accounts and servers (backing up the new machines and user accounts to the RAID once per week).

Over the next few posts I will attempt to document the migration. I’ll start with initial setup then go to migrating data/accounts then end with the final phase out process. I hope that the next few entries may help people who get into a similar situation as well as keep a record for myself on any problems I might face.