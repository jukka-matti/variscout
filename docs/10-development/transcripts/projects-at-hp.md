---
title: Projects at HP
type: transcript
language: en
date: 2026-04-05
duration: 1905.8s
status: raw
audience: [developer, product]
category: reference
---

# Projects at HP

Voice memo transcript (English, ~32 min). Detailed first-person account of HP projects from the 1980s covering supplier rationalization, injection molding process optimization, just-in-time manufacturing, and supply chain simulation using Smalltalk.

**Key topics:**

- Supplier base reduction: 700+ R&D suppliers → 7 using rational subgroups by commodity
- Injection molding lab: Nissei electronic machines, sensor-driven control, Y=f(X) equations, mold changeover 4h → 7min
- JIT line (Joey/PaintJet): Barcode-driven routing, robot PCB selection, first JIT automated line
- Smalltalk/HPM simulation: Object-oriented supply chain model, IDEF modeling, 6-year-old demo to CEO John Young

## Transcript

[00:00] It's getting hot in here, so I'll...

[00:08] Okay, so that was a couple of bars from the stripper just in case.

[00:20] When I joined HP, I was hired as a buyer, okay, and when I got to HP,
they saw I had been in charge of weapon systems acquisition. I was a professional
weapon systems acquisition manager, which meant that my job was actually above that
of the head buyer in the HP division. And so they said, well, how do we, you know,
take advantage of this? And one of the things that I had to do was qualify suppliers.

[00:50] So the first job they gave me was to reduce the supplier base in R&D,
and they had over 700 suppliers in R&D. And their products at that time,
when they came out with them, only had about 125 parts. So do we really need 700 suppliers
if our products are that well-founded? And if we have that many suppliers,
it probably means we have a lot of redundant suppliers, maybe some with old technology,
some that basically are not growing with us and so forth. So let's reduce the supplier base,
and then maybe we'll have more cost-efficient purchasing. So this was my job, you know,
how do you figure out who the best suppliers are? And then they just sat back and watched.

[01:40] And so what I did was I developed rational subgroups by commodities. Now this sounds
very familiar now, but this didn't exist back then. So we were talking about 1983 now,
or 84, somewhere in there. And we developed rational subgroups of suppliers. So I had all
injection molded suppliers. And then I realized that I had to have a breakpoint. So it was 120
ton presses below and 120 ton presses above, because above were the ones that did all the
outside cases and below did all of the internal parts. And there was two different types of
engineering requirements and so forth.

[02:26] And then the real question was, you know,
how many do we need to have and so forth, what technologies? And we found out that there
were actually some 42 different injection molding companies involved in this. It was over 40,
just shows the number, because 42 is my favorite number, courtesy of Doug Adams and
Hitchhiker's Guide to the Galaxy, whole other story.

[02:52] Anyhow,
so we had all of these suppliers. So I put a team together, and I took someone from
material sciences. We had our own injection molding lab at HP, which was not actually
very good. But we did have somebody who was the supervisor who was running his name was Sal
Delgado or something like that. And he was so stupid that, you know, we said,
make the process so simple, Sal can follow it. That was the guy when we set the project,
anyhow. But that's so we got out there.

[03:30] And then we whittled it down so that there were
four different categories of injection molding companies.
Four.
Four. And so there were some for engineered quality parts like the pen head and the pad
where you would actually put the thin film technology on the inkjet. And they had to
be very high precision and so forth. And we had zero qualified suppliers in that category,
zero. None of them had engineering precision. None of them understood
how do you actually manage all the data and so forth. And so that led to my second project.

[04:05] Then the next category was the bump of the bump of the parts. And so these were structural
parts mostly where you would put a printed circuit board snap fit in or something like
this or screwdriver in first, and then we moved to snap fits and so forth. And then
the bulkier products. And then we had Big Bertha. Big Bertha was one of these
landscape style printers. It was maybe two meters across and used it for engineering drawings.
And we had Big Bertha and Little Bertha, two different sizes, C and D size papers.
And, or C, D and E. Anyhow, but they had these really massive parts.

[04:55] And then we had those that just made the case that went on the desktop printer plotters.
So anyhow, we took a look at each of those categories and we decided there was only one
that was actually really good with the really largest ones of Bertha lines.
Okay, get rid of the rest. And then for the cases, there were actually two,
because that's what a lot of different companies use. So we took the two best suppliers there.
And then we came down on the internal structural parts. There were about four
that we used. So we had captured this down. So now there was seven suppliers instead of 40.
And they said, oh, that was interesting. And I had done audits on all of them,
so it made sure we had a rationale.

[05:46] But then we had this missing category,
the high technology parts. And so the question I left them was,
how do we do engineered plastics injection molding?
Served up this beautiful tennis ball, which is coming up. It's ready and set for a smash.
But there's nobody holding the racket. So they said, oh, you can do it.

[06:11] And so they gave me two engineers, one from Stanford, who was an electrical engineer,
and a mechanical engineer from UC Davis, who were coming out of an internship, summer
internship. And they said, here, build us an electronic, you know, a state of the art
electronic molding capable of doing engineered parts, and take Sal and his team, and you
replace all of their machines. Well, they had eight stalls for injection molding machines.
And so that's where we built the first high tech, state of the art,
sensor driven control mechanism, internet of things type of mechanism.

[06:53] Okay.
So what did we do? Well, we had a drying system where we dried the material to make
sure that there was not excess water, and that it came down pelletized into the systems.
And we had six molding machines capable of doing
all of the different, well, they were all putty colored, basically, but off white. And so we
standardized the material to off white. And we had those all fed from above, and then this
drying mechanism. Then we had one that did clear lexan. So those were the windows that
look through on these devices where they flip up and down. And then we had one that was going
to be the high engineered line where we would do all the very fine work. And so all of the pen
plots and stuff like this.

[07:41] And so what we did was we bought all new machines. Now 1983,
Nisei had come up with the first electronic controlled injection molding machine.
And so we bought eight 80 ton machines. Okay. And so we put them in, and then we realized that,
oh, electronic controls, what can we do with that? So we took from the electrical engineer,
he and I went to Japan, to Nisei, and we specified all of the places to capture data.
And so we worrying about process, location, measurement systems, quality of measurement
systems. This is sound familiar.

[08:28] And then we're putting all of this together. And then we created
an equation for how can you actually make perfect plastic parts after the first four shots?
So the first four shots, why that? Because it took four shots to feed the barrel,
or as they would say, charge the barrel so that it's got now liquid plastic instead of
bullets. And so basically four shots you're going to throw away with scrap.

[08:57] Okay. So how do you know what you have to do? Well, you have all of these parameters,
barrel temperature, barrel pressure, clamping force of the mold, ejection force of the parts,
because if the ejectors are too strong, it will twist the wet plastic coming out.
And then we had even the angle of the mold and so forth. How did the molds come together?
So we basically re-engineered the whole part.

[09:30] And we had a
mechanism to measure the drying or the humidity level of the pellets coming in.
And then we had a weighing device to weigh the pellets coming in so that they would be
when they shrunk and got into the part. And so there wouldn't be too much excess plastic to
create flashing and excess parts going out around the sprue. The sprue is the center part.

[09:55] And then we had the clamping force done in Newtons. And it was pneumatic,
so the pneumatic control clamping force. And so we had that, the air pressure there was
telling us this. The ejector pins were coming out, but it was like, sorry.
But they were shooting out and that was measurable force. And then we had
the cooling time, but the cooling time was easy to do. So that was immaterial.

[10:33] And then we measured the dimensions after they cooled. And that was the why measure.
And all of the others were Xs. And we created an equation. So we created Y as a function of X for that. And
that was basically no six sigma whatsoever, but it was.

[11:02] But it was also, we spent those
machines. It was something like $700,000 from machines and equipment and stuff.
And then we had preheat racks for the molds. So instead of putting the molds into the press
and heating them in the injection molding machine, we heated the molds and then clipped
them hot into the molding machine, cutting down cycle time. So we had mold change over time.
Between the last shot with the old mold, first shot with a new mold, reduced from four hours.

[11:40] Am I going to do this story? Yeah, but I don't remember seven minutes.
And so we had then created the highest technology, most efficient molding lab in
all the world and the only one that fit number one category. Then Kodak found out about that.
And Kodak says, we have all these electronic cameras. We need to have that too. So Kodak
bought our engineering capabilities little team to help them with their cameras in Rochester,
New York. Well, that's when I realized that HP will sell anything.

[12:23] When we went on from
there, I went on to adjust in timeline because we had learned so much about just in time
and actually doing that, we were creating the first just in timeline for the inkjet printers,
the Joey line, which was the paint jet product. And in creating that, we had to have all the
material flow right. We had to have the equipment right. We had to have the computer
control systems right. And all of these things merged together into one cell.

[12:53] So when the
order came in to the factory, it would immediately go into a computer and it would be sitting in a
queue. Okay. The queue would then send a signal to a robot at the beginning of the line
and it would pick one of three printed circuit boards, either an HP IB communications interface,
RS-232 interface, or
Centronics. And so we had those three boards stacked in a robot. So we'd grab one and then
it would print on that a barcode. And that put it then on the beginning of the line.

[13:37] There was a barcode scan before each piece of equipment, which then said,
what do we do to the board at this station? So it first went through
auto-inserters for components, resistors and capacitors and so forth that were on there.
And then it had Seco Detran robots putting odd form devices on there that didn't fit with
automatic inserter system. And then it went from there to a wave solder flow.
And then it went to electrical test. And from electrical test, if it was approved,
it went to the production line. And an hour later, that became a product with the same
robot, I mean the barcode on it, identifying the shipping label that they started with.

[14:30] That was the first just-in-time line. And in that line, we had disqualified Motorola because
Motorola was the only, the chip inserter we had was a Panasonic chip inserter,
but they used standardized Japanese tubes, which were about 19.1 inches long and the
tube makers or the providers that they had to make them deliver them in those tubes.
And Motorola refused. They said, well, if you want them in different sizes,
you can do it yourself. And so I said, fuck you and discounted them.

[15:12] And it was a $5 million a year chip order. And so the head of the communications division
was the Motorola assigned customer advocate for HP. And he came, he says,
I need to see this line. Why is it so special? And he came and he looked at it. And guess what?
They bought the HP 1000 cell controller, the software,
Seco D-Tran robots, Panasonic inserters for themselves. And that was the foundation
for their pocket page or the bandits that made this thing as the first,
they stole everything or they bought it from somebody else and then public relations.

[16:39] And then after the supplier and then
the Joey's and the injection molding, the Joey self, then they made me the business manager
for inkjet products. So I then had the first paint jet. And then the follow on to that, which was
the R and D code names squirt was the paint jet code name. So that's like little octopus,
little squirt squid. Massive. That was where they moved from 160 DPI print to 360 DPI print. And
they could almost do color quality. And so I had both of those products moving through.
The major difference was in software and the print engine or the print head.

[21:41] And then at HP, they asked me to come in and do the coding. Well, now it's very simple
coding. And they did the coding in a language called small talk. And I don't know if you've
heard of small talk. Small talk was the very first object oriented language. It was named small talk
by Xerox engineers who created it. And the idea was it would be small. In other words,
not much code. It would be written in natural language that children could program. The total
documentation for the whole thing was like less than 10 pages.

[22:20] And so this was there.
The guy who sold it to us, his name was Sam Adams, not the guy who made the beer,
but the guy who was a computer programmer. And what he did was he brought his daughter with him
to HP. And she was sitting in the meeting and everybody thought this was really cute,
until he turned to John Young, the CEO. He says, what is your wet dream about software?
What would you really like it to do? He says, we're about to fund a model to evaluate sales by
territory. And he said, oh, for what? Well, we're going to start with the US. We have four
major regions here and all these products. And we'd like to be able to understand,
how do we do distribution? Where do we put parts and all this other thing?

[23:06] He said,
oh, okay. And he turned to his daughter and she said, do you think you could do that?
And this little six-year-old girl said, sure. And John Young said, no way, no way. He's looking
for spending millions on this software. And so this is a morning meeting. So he said to John
Young, he says, okay, at the end of the day, we'll have a product for you. What?

[23:32] So the
principle of inheritance is you take already written troubleshooted code that's stable.
So she took a geographic map of the United States and divided it into rational subgroups,
which were states assigned to regions. Five minutes. So she gets that done. And then
she assigns products. What's sold in each state? So she takes a list out of an Excel
and then assigns those to the states. And then she has a sales algorithm in terms of the
sales in each of those states.

[24:05] And so, and she builds this whole thing up and then she asks,
she has the meeting at the end of the day. She asked the question. She said, well, what
do you want to know? He says, well, I just moved here from Colorado. I know the market
pretty well. How will laptops or just come up with Vectra computers? I think he asked
about the Vectra. How will the Vectra sell in Colorado? There's a forecast.

[24:34] And he says, well, that looks about right. And then he starts trying other things. And he said,
you did this in a day? How did you do this? And so she's showing him this little six year
old girl is showing him how to program an object-oriented code using small talk.

[24:53] Okay. And so he said, well, if we can do this, he says, we can save lots of money.
He said, you know, every time we put a new factory out, we mess up on things like
supply chain. You know, will it make distribution channels? You know, the suppliers, you know,
where are the parts coming from? And so forth. He says, we need to have something like this
high volume distribution supply chain. So he assigned some Sam Adams to,
what was his name? I can see his face. He was the VP of manufacturing anyhow.

[25:25] And he had an assistant who was a really smart girl named Sarah Beckman. Sarah was doing her,
finishing her PhD at UC Berkeley in industrial engineering. And he assigned Sarah to work for
doesn't matter because he didn't do anything, but the VP of manufacturing and to put together
a team of no more than four people to do this. He says, if that six year old can do
you guys can learn it all and get this done.

[26:01] So Sarah came in and then she went over to Stanford.
Now HP and Stanford have a very close association called the honors co-op program
where HP engineers can go to Stanford and take courses while they're still employed by HP
and HP pays a tuition for them. Now I was in the honors co-op program at the time and,
graduating from that program at that time was a guy named Corey Billington,
who's a professor emeritus at the Swiss university,
IMD or something like this. And he's supposedly the number one supply chain guy in the world.

[26:33] Just starting or ahead of me, no one year ahead of me in the program was a guy named
Eric Johnson. And Eric just retired as the Dean of the Vanderbilt University graduate school
business. And then Larry Marin, who is a computer nerd, and he was really on the pot. And he
didn't turn out to be much of anything, but he could code like you wouldn't believe. And when
you gave him the simple language, it really was easy. And then I was the programmer and
computer nerd that ran the thing on an ME10 CADCAM system.

[27:11] And so that was a team that
together. We did first the high volume shipment product. And the question was,
how do you create a just-in-time automated manufacturing system? So it was like an MRP
for just-in-time. And so we created that. And then the next one was the high volume
shipment unit for supply of the parts to consumer industries. Because before that HP had
basically been selling business to business. And so they'd just ship product in bulk if you
wanted to order spare parts and something.

[27:49] And it would go from HP to wherever the warehouse was
where they'd store this. And now we had to get it to individual stores. Because this inkjet
printer was actually going to be sold commercially in stores all around the world. And not just
in bulk to OEM providers. And so we then developed the model and extended it using some
principles of Sam Adams' daughter. Now actually we hired her as a consultant,
which I thought was kind of cool. And she used to like to draw her programs out instead of in
any graphical model. She would draw them on crayons on paper. Cool kid. Really bright mind.

[28:31] Anyhow, so that was where HPM came from. And we used the IDEF modeling model as the core for
how we developed the models. So that's the box representing a process with controls coming in,
information materials coming in from the left, exiting from the right information
about the output and then the output materials. And from the bottom the resources required.
And so that's the rough structure. And then we would structure that and then we would do this,
what's it called? Rational subgroups of each of the subsets in the process that went in there.
And so that's one of the PowerPoint slides that's now in my Six Sigma stuff.

[29:18] So anyhow, that's where that came from. Did I answer the question or did I just
have so many side effects from those? It's okay.

[29:28] Yeah. And that was the system. I remember the story about the,
when the inject came out and the sales forecasts were through the roof. Yes.

[29:44] So we had never made more than a couple of thousand products a month.
I think that the biggest one was HotLips. That was the code name for it.
And HotLips was a very, very fast inkjet printer. And the most we'd ever made was 5,000 in a month.
That was considered a lot for the old production line. The first month of paintjet was 10,000.

[30:13] Now the price on paintjet was $999. Why? Because almost every
operational manager in a factory can sign a purchase order for under a thousand.
And we got it so that they would be buying these and saying,
you did a great job as an engineer. Here's a personal printer for your desktop.

[30:41] And we made the money, not so much on the product. We made money, but as they say in
Russia, very little. But the inkjet engines, they were about $30 a head.
And so there's three heads in there. So that's like 120. And so you have to buy the printer
and then you buy three heads, but then you have to replenish the three heads. And it was
special paper that they printed on. So you have to replenish the paper. And it was special
acetate to make PowerPoint slides that you could put on the projectors. And so all of
that stuff was engineered. And that's what Mary's group did. It was all the special papers
and the acetates and the inkjet. Fun times.
