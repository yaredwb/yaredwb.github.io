---
layout: post
title: "Counterintuitive Math"
date: 2015-10-31 21:39:39
author: yaredwb
categories: ["Mathematics"]
---

There are several mathematical statements or problems that do not make sense at all at first glance, until closely scrutinized. A detailed examination then proves that the statements are true and shows that they are completely counterintuitive. Here are some of my favorite examples.

**The Monty Hall problem**

The Monty Hall problem is a puzzle where the underlying mathematical explanation is based on probability theory. A short statement of the problem reads:

*There are three doors: A, B and C. There is a car behind one of them and goats behind the other two. You are given a chance to pick a door and win what is behind. You will pick one of the doors (say A) and then from the other two doors (B and C) the one which has a goat behind is revealed to you (say B). Now, you are told that you are free to switch your choice to the other remaining door i.e. C. Will you have a better chance of winning the car if you switch your choice from A to C or if you stay with your choice of A?*

A quick and intuitive decision seems that it doesn't make a difference if you stay with door A or switch to door C; your chance appears 50/50. But it is not! You always have a better chance of winning the car if you switch your choice. Here is a mathematical explanation:

Your initial chance of winning the car is 1/3. After a door which has a goat behind is revealed, if you stay with your choice, your chance of winning is still 1/3. But the other door suddenly holds the remaining 2/3 odds. So, switching gives you a 2/3 chance of winning. That still doesn't seem to make sense, right? A detailed evaluation helps. There are three possible locations of the car.

- A - car, B - goat, C - goat: You choose A. B is revealed to you. If you stay with A, you win. If you switch, you lose.
- A - goat, B - car, C - goat: You choose A. C is revealed to you. If you stay with A, you lose. If you switch, you win.
- A - goat, B - goat, C - car: You choose A. B is revealed to you. If you stay with A, you lose. If you switch, you win.

So, switching wins you the car 2/3 of the time! The concept works for any number of choices other than 3. Have a look at [this video](https://www.youtube.com/watch?v=4Lb-6rxZxx0) for more explanation.

**The sum of all natural numbers**

Natural numbers are ordinary numbers that we use for counting i.e. $1,2,3,\ldots$. So, what is the sum of all natural numbers? An intuitive answer is positive infinity. The series is actually divergent and a trick used as a finite sum result is:

$$1 + 2 + 3 + \ldots = -\frac{1}{12}$$

What?! That's impossible! Did you say that? Here is a mathematical proof by [Srinivasa Ramanujan](https://en.wikipedia.org/wiki/Srinivasa_Ramanujan). Let's call the sum $s$,

$$s = 1 + 2 + 3 + 4 + 5 + 6 + \ldots,$$

multiply it by 4,

$$4s = 4 + 8 + 12 + \ldots,$$

and then take the difference between the two (we subtract even numbers from even numbers and keep the odd ones) to get

$$-3s = 1 - 2 + 3 - 4 + 5 - 6 + \ldots$$

But $1 - 2 + 3 - 4 + 5 - 6 + \ldots$ is a well-known [alternating series](https://en.wikipedia.org/wiki/1_%E2%88%92_2_%2B_3_%E2%88%92_4_%2B_%E2%8B%AF) which converges to $1/4$. Thus, we have:

$$-3s = \frac{1}{4} \Rightarrow s = -\frac{1}{12}$$

Things get a bit spooky when infinities are involved. This sum has, surprisingly, found an application in theoretical physics, particularly in string theory.

**Benford's law**

If you are given a set of numerical data about some naturally occurring item or event (e.g. depths of lakes), how many of the numbers would you guess have 1 as a first digit? How many with 2? There are nine possibilities. It appears that all numbers from 1 to 9 have the same chance of being the first digit. That's not usually the case, though. [Frank Benford](https://en.wikipedia.org/wiki/Frank_Benford) has worked out a distribution that is almost always true for numbers in nature or related to nature. He stated that the number '1' appears as the first digit about 30% of the time, '2' about 17% of the time and decreasing for the next digits, with '9' having the least chance of about 5%. This law is actually used to detect fraud in financial markets. Check out this video.

<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/O8N26edbqLM" title="Benford's law" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
