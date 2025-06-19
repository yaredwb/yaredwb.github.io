---
layout: post
title: "Counterintuitive Math"
---

There are several mathematical statements or problems that do not make sense at all at first glance, until closely scrutinized. A detailed examination then proves that the statements are true and shows that they are completely counterintuitive. Here are some of my favorite examples.

<strong>The Monty Hall problem</strong>

The Monty Hall problem is a puzzle where the underlying mathematical explanation is based on probability theory. A short statement of the problem reads:

<em>There are three doors: A, B&nbsp;and C. There is a car behind one of them and goats behind the other two. You are given a chance to pick a door and win what is behind. You will pick one of the doors (say A) and then from the other two doors (B and C) the one which has a goat behind is revealed to you (say B). Now, you are told that you are free to switch your choice to the other remaining door i.e. C. Will&nbsp;you have a better chance of winning the car if you switch your choice from A&nbsp;to C&nbsp;or if you stay with your choice of A?</em>

A quick and intuitive decision seems that it doesn't make a difference if you stay with door A&nbsp;or switch to door C; your chance appears 50/50. But it is not! You always have a better chance of winning the car if you switch your choice. Here is a mathematical explanation:

Your initial chance of winning the car is 1/3. After a door which has a goat behind is revealed, if you stay with your choice, your chance of winning is still 1/3. But the other door suddenly holds the remaining 2/3 odds. So, switching gives you a 2/3 chance of winning. That still doesn't seem to make sense, right? A detailed evaluation helps. There are three possible locations of the car.
<ol>
 	<li>A - car, B - goat, C - goat: You choose A. B is revealed to you. If you stay with A, you win. If you switch, you lose.</li>
 	<li>A - goat, B - car, C - goat: You choose A. C is revealed to you. If you stay with A, you lose. If you switch, you win.</li>
 	<li>A - goat, B - goat, C - car: You choose A. B is revealed to you.&nbsp;If you stay with A, you lose. If you switch, you win.</li>
</ol>
So, switching wins you the car 2/3 of the time! The concept works for any number of choices other than 3. Have a look at <a href="https://www.youtube.com/watch?v=4Lb-6rxZxx0" target="_blank" rel="noopener noreferrer">this video</a> for more explanation.

<strong>The sum of all natural numbers</strong>

Natural numbers are ordinary&nbsp;numbers that we use for counting i.e. $latex 1,2,3...$. So, what is the sum of all natural numbers? An intuitive answer is positive infinity. The series is actually divergent&nbsp;and a trick used as a&nbsp;finite sum result is:
<p style="text-align:center;">$latex 1+2+3+...=~-\frac{1}{12}$</p>
<p style="text-align:left;">What?! That's impossible! Did you say that? Here is a mathematical proof by&nbsp;<a href="https://en.wikipedia.org/wiki/Srinivasa_Ramanujan" target="_blank" rel="noopener noreferrer">Srinivasa Ramanujan</a>. Let's call the sum $latex s$,</p>
<p style="text-align:center;">$latex s = 1 + 2 + 3 + 4 + 5 + 6 + ...$,</p>
<p style="text-align:left;">multiply it by $latex 4$,</p>
<p style="text-align:center;">$latex 4s = 4 + 8 + 12 + ...$,</p>
<p style="text-align:left;">and then take the difference between the two (we subtract even numbers from even numbers and keep the odd ones)&nbsp;to get</p>
<p style="text-align:center;">$latex -3s = 1 - 2 + 3 - 4 + 5 - 6 + ...$</p>
<p style="text-align:left;">But $latex 1 - 2 + 3 - 4 + 5 - 6 + ...$ is a well-known <a href="https://en.wikipedia.org/wiki/1_%E2%88%92_2_%2B_3_%E2%88%92_4_%2B_%E2%8B%AF" target="_blank" rel="noopener noreferrer">alternating series</a> which converges to $latex 1/4$. Thus, we have:</p>
<p style="text-align:center;">$latex -3s = \frac{1}{4} \Rightarrow s = -\frac{1}{12}$</p>
<p style="text-align:left;">Things get a bit spooky when infinities are involved. This sum has, surprisingly, found an application in theoretical physics, particularly in string theory.</p>
<p style="text-align:left;"><strong>Benford's law</strong></p>
<p style="text-align:left;">If you are given a set of numerical data about some naturally occurring item or event (e.g. depths of lakes), how many of the numbers would you guess have 1 as a&nbsp;first digit? How many with 2? There are 9 possibilities. It appears that all numbers from 1 to 9 have the same chance of being the first digit. That's not usually the case, though. <a href="https://en.wikipedia.org/wiki/Frank_Benford" target="_blank" rel="noopener noreferrer">Frank Benford</a> has worked out a distribution that is almost always true for numbers in&nbsp;nature or related to nature. He stated that the number '1' appears as the first digit about 30% of the time, '2' about 17% of the time and decreasing for the next digits, with '9' having the least chance of about 5%. This law is actually used to detect fraud in financial markets. Checkout this video.</p>
<p style="text-align:left;">[embed]https://www.youtube.com/watch?v=O8N26edbqLM[/embed]</p>
