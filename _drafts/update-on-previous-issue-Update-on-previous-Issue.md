---
id: 60
title: 'Update on previous Issue'
date: '2008-11-11T18:09:50-05:00'
author: 'John Mahlman IV'
layout: post

permalink: /2008/11/update-on-previous-issue/
dsq_thread_id:
    - '28244116'
ngcp_type:
    - opinion
categories:
    - Uncategorized
tags:
    - servers
    - Technology
---

So, very odd things are happening. First, our DNS server is not taking updates for some reason, unless Poly isn’t sending updates for some reason. Either way, on my network, the site does not work, on any other network, it’s fine now. Second, the site that was originally setup was not working of course, but I decided to do some trickery. I wanted to see if the system was actually working properly, or if it was actually the WordPress install. I switched the working virtual host home directory with the Word Press one, and lo-and-behold, it didn’t work. I just uploaded a fresh WordPress install to the proper directory, and it’s now a working site!

Turns out it was NOT Leopard server, but the WordPress configuration. So let this be a lesson, always start fresh if you can. 🙂