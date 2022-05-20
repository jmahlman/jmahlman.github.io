---
id: 47
title: 'Choosing a CMS for your site'
date: '2008-09-29T10:55:55-05:00'
author: 'John Mahlman IV'
layout: post

permalink: /2008/09/choosing-a-cms-for-you-site/
ngcp_type:
    - opinion
categories:
    - Technology
tags:
    - Technology
    - 'web design'
---

As I’ve said on here [before](http://yearofthegeek.net/?p=37), I like using newer Web 2.0 technologies. With that in mind, I have tried many different content management systems for various sites. Recently I was given the task to re-design the [PolyBOTS](http://polybots.poly.edu/) website from it’s old hard-coded design (which was also designed by me) which replaced a former Front Page design that I will never mention here again. Though the second design looked alright, it wasn’t good for updating news or adding anything spectacular. We had no CMS, so I hand coded everything in Dreamweaver which made it annoying, so no updates were ever made.

Picking a CMS was a task in itself. I figured that they needed something simple, functional, and can be built on if needed. First we looked at [Joomla!](http://www.joomla.org/). Joomla! is a very nice CMS with a lot of functionality, but proved to be very difficult to work with and customize for us. Not to mention it was a little power hungry for the old server; P3 800, 384MB ram, Mandriva Linux. So we scrapped that almost immediately. I then started learning about Drupal.

[Drupal](http://www.drupal.org) is an open-source CMS with so much built in functionality that you really don’t need too many plugins or add-ons to make it nice. It’s got a huge user base, and even at Poly there are so many people that use and know it that it would be like having live support. I installed drupal 5.7 on the server and the PolyBOTS webmaster and I started to design the site with a theme we downloaded and heavily modified. The site started to take shape but there were still some major issues with caching and CSS. After disabling that, the site would just not look like it was supposed to look, mainly because of trying to fix the theme template files. We also found it difficult to integrate the image gallery with drupal (integration was easy, making it look good was not). This past Friday, however, I got completely fed up and decided to go for WordPress.

By now you know WordPress; this site is run off it. A few reasons for sticking to WordPress; first, it’s lightweight and functional; second, there is excellent support and a lot of add-ons and plugins out there for it; third, I actually know the coding enough that I can edit things to make them look and act the way I want them to. I also chose it because it’s simple enough for what they need but if they really want to add something, it can usually be added as a plugin.

This whole re-design helped me learn a lot about CMS’s and site design in general. A few major things:

- Don’t use a heavy CMS for a light project
- Make sure you know how to edit the code just in case you need something to do something else
- Get a CMS with good support
- Use a CMS that can use plug-ins and other add-ons
- Test out a few systems before settling on one

So, check out their new site with the link above, let me know what you think about it. Also, let me know if anyone has any other tips for re-designing small sites. It’s always helpful to hear what other people have to say.