---
id: 423
title: 'Getting more from my Original DROID (Part 2: Restoring and Troubleshooting)'
date: '2011-04-13T12:23:26-05:00'
author: 'John Mahlman IV'
layout: post

permalink: /2011/04/getting-more-from-my-original-droid-part-2/
aktt_notify_twitter:
    - 'yes'
aktt_tweeted:
    - '1'
dsq_thread_id:
    - '6122012745'
ngcp_type:
    - opinion
categories:
    - Hardware
    - Phones
    - Software
tags:
    - android
    - 'cell phone'
    - cyanogenmod
    - DROID
    - phone
    - software
---

In [part 1](http://yearofthegeek.net/2011/04/getting-more-from-my-original-droid-1/ "Getting more from my Original DROID (Part 1:Rooting and CM7)") I described (in little detail) how I rooted my phone and installed CyanogenMod 7 on it to get some more mileage out of it until I upgrade to a newer device this year. But of course every upgrade and every hack isn’t without it’s issues and every hack isn’t perfect at all. Cyanogen never claims to be 100% trouble-free, and every users’ experience will vary depending on device and applications installed; after all, it is technically a hack made by third-party developers…and no developer is perfect. The methods for flashing are also different for each user.

I installed CM7 when it was at RC1 for the DROID (still buggy, but still good for everyday use) and I originally flashed my phone by doing a factory reset of the device (removes everything) and then installing the ROM. This gave me an endless boot screen. What I had to do to fix this was not only do a factory reset, but wipe the cache partition AND the Dalvik cache partition. This was easy with the ClockworkMod and it was also nearly 100% risk free since I had a complete Nandroid backup. After wiping the two it booted successfully!

I noticed that in Android 2.3 Google will restore all of your previously purchased and downloaded apps if you want it to automatically on a new device (only the app itself, not the data..like game save data). This is great, but I already decided to use MyBackup Root for this, mainly because I wanted to have my stuff there with all of the data. So i just told the phone not to download everything and I’ll just restore everything from my backup. What this left me with was broken installed apps with no way to update them because the Market links were all hosed. This sucked, now what was I supposed to do? I decided to flash again and allow Google to push the apps to my phone. This process took some time but everything was downloaded for the most part; unfortunately, I didn’t have my app data, so all of my game data and all of my settings were gone…I check MyBackup and sure enough I was able to restore data only! I did that and bingo, everything worked again with all of my old data! A few apps needed to be reinstalled or needed their data wiped (Google maps and Facebook I think) but for the most part everything worked just as it was supposed to.

<figure class="thumbnail wp-caption aligncenter" id="attachment_424" style="width: 178px">[![](https://i2.wp.com/yearofthegeek.net/wp-content/uploads/2011/04/Restore-168x300.png?resize=168%2C300 "MyBackup Root restore")](https://i2.wp.com/yearofthegeek.net/wp-content/uploads/2011/04/Restore.png)<figcaption class="caption wp-caption-text">Choose which to restore? Yay!</figcaption></figure>So now that I had my apps on my phone, I was nearing happiness with my hacked DROID. I say nearing because I was still having many issues with other things. I won’t go into every little one but I will talk about the two that almost made me decide to go back to stock.

### LED Notifications

The one thing I love about Android phones is the LED notifications. A simple little LED in the corner of my phone blinks different colors for certain things (texts, emails, etc) so I don’t need to turn the screen on, or unlock my phone to see what I missed or see what that beep was from…I can just look at the color of the LED. Funny thing happened after installing, it stopped working. I would look down and nothing would be blinking but when I unlocked my phone I’d notice an e-mail that I missed! What was going on here? I looked in the settings and found that CM has basically rewritten the notification system and you can customize colors and blink rate from it if you so desired, but instead it broke the damn thing. This wouldn’t fly with me, I was about to go back to stock because one of my favorite features was broken…then I found the forums. I searched the issue on the forums and found a lot of people with the same issue, on different phones even! Reading through many of the posts they all usually came around to the same solution, un-check everything in the LED settings then check them again then hit “Reset all LED notifications” and reboot. And it worked! I had my LED back and working and now it was even better because I can change the settings for every program and even change the colors and blink rate for them, pretty neat.

<figure class="thumbnail wp-caption aligncenter" id="attachment_426" style="width: 178px">[![](https://i1.wp.com/yearofthegeek.net/wp-content/uploads/2011/04/ledprogramsett-168x300.png?resize=168%2C300 "LED Program Settings")](https://i1.wp.com/yearofthegeek.net/wp-content/uploads/2011/04/ledprogramsett.png)<figcaption class="caption wp-caption-text">Change color and rate for LED notifications</figcaption></figure>### Missing Messages

Now that my LED notifications worked I was happy that I could look down and see if I missed any emails or (more importantly) text messages…but strangely I felt that I was receiving less messages. I went an entire day without a text message, which is very odd for me actually. I looked at my phone, no blinking LED, I unlocked the phone, no notification in the menu, I opened the messaging app and boom, new texts, some as old as a day! What the hell was going on with this? I’m missing text messages now? This used to happen with my [EnV Touch](http://yearofthegeek.net/2010/01/cell-phone-fussing/ "Cell Phone Fussing"), never my DROID! I tried resetting my notifications for the app, and it would work for a while after I opened the app. I figured, okay, it’s fixed, but then it would stop later on in the day. I was getting very frustrated with this now and was again thinking about going back to stock. I hit the forums again and found one post about the issue with one simple solution:

<figure class="thumbnail wp-caption aligncenter" id="attachment_427" style="width: 237px">[![](https://i1.wp.com/yearofthegeek.net/wp-content/uploads/2011/04/message-app-check-227x300.png?resize=227%2C300 "Message App checkbox")](https://i0.wp.com/yearofthegeek.net/wp-content/uploads/2011/04/message-app-check.png)<figcaption class="caption wp-caption-text">The solution! Check that box!</figcaption></figure>Once I checked that, never missed another message. It locks the message app in the memory so it’s always running. Sure it uses up memory, but my messages are more important to me than the amount of apps I can run at one time.

*Side note: But why does the DROID do this with CM7? The DROID has 256MB RAM, this was a lot when the phone came out and with 2.1 it was fine. Once 2.2 was released memory was becoming a problem for the phone. The phone had trouble even keeping the Home app in memory; if you ran a program that was memory hungry and went back to the home screen you’d have to wait for it to redraw because Android’s memory management would kill it. So in CM7 you can see the two check boxes for home and messaging, this stoped the redrawing(relaunching) and the missing messages…but it took some memory away of course which means you can only do so much multitasking before apps start getting killed. Android 2.3.3 uses more memory, and the DROID just doesn’t have that much…so CM7 also allows asset purging to free up RAM as well as compucache (memory compression). These use a little CPU but allow you to multitask fairly well; it’s nowhere near as good as other newer phones, but it works.*

There were some other small odds and ends that I had fixed by tweaking settings and installing updates but I thought that these two were really the most damming for me. I managed to fix them with help from other nerds at the [CyanogenMod Forums](http://forum.cyanogenmod.com/ "CyanogenMod Forums") who were running into similar issues and there are some I managed to fix by trial and error. Now, he ROM still has it’s occasional reboots and hiccups (not very often) and they usually happen with two programs; Google Maps and the Camera app, but these crashes happen less and less with each update.

CM7 is now out of RC and was released as Gold…but not for the DROID yet. It still is very much a work in progress, but the progress is going very quickly, and I really like the direction it’s heading. They’ve managed to give DROID users Android 2.3 even after Motorola decided it “wouldn’t work” on the phone. Well, it is working (for the most part) and I’m fairly happy with it. It has really allowed me to use my phone a bit longer than I was expecting. I’m probably going to wait until August to upgrade my phone instead of going for the Thunderbolt, but time may change that. What I do know is that my phone still works well and I will get more time out of it because of the ROMS.