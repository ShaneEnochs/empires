*chapter Chapter 1: A Simple Assignment

*passage orchard_intro
*title A Simple Assignment
*journal met_cassius "You worked alongside Cassius, the senior League field warden assigned to supervise you near Lezano."

The countryside outside the port city of Lezano is actually quite pleasant on mornings when you're not chasing anything. A few miles inland, the busy streets and crowded docks give way to gently rolling farmland, with orchards covering the lower hills and open fields stretching toward the distant treeline. Low stone walls mark the boundaries of some of the older properties, while hedges and narrow dirt paths separate the rest. The fruit trees are heavy with yellow fruit that smells sweet whenever the breeze carries the scent across the road. A narrow irrigation channel brings water down from the hills, feeding the fields before passing beneath a small stone bridge farther west. You would quite happily spend the rest of the morning here if you weren't so busy making a fool out of yourselves trying to catch this Chikorita for relocation.

And to be clear, the little Pokémon has shown exactly zero interest in making this an easy task. The weird, pale green dinosaur-looking thing with a gigantic leaf protruding from the top of its head is currently standing in a strip of grass on the other side of an irrigation ditch, happily chewing a mouthful of clover while your partner Cassius tries to work out how to cross without getting his boots wet. Behind the Chikorita, a thick hedge separates the grassy bank from another orchard. You've already spent most of an hour following it through an orchard and two adjoining fields, and the sun is high enough now that the back of your neck is beginning to burn.

"It's about patience," Cassius tells you in a sagely manner, examining the ditch. He rests one hand on his belt and shades his eyes with the other. His green field jacket hangs open, its sleeves rolled up to his elbows. Mud has already splattered across one side of his face, though he doesn't seem particularly concerned about it. "People think you can just throw a Poké Ball at every problem. A healthy Pokémon like this little guy doesn't want to be caught, so it would just break out anyway. You need to understand what it wants. Make it comfortable enough to let you near it. I've been doing this a good deal longer than you have, so pay attention and watch the master at work."

Weird. You're pretty sure you've been watching him at work for a while now.

*choice
#Give Cassius some encouragement. -> ditch_attempt [set cassius_encouraged true]
#Remain quiet and watch. -> ditch_attempt [set cassius_encouraged false]

*passage ditch_attempt
*title A Minor Setback
*hide_title
*if cassius_encouraged == true
  *add cassius_relationship 1

*show_if cassius_encouraged == true
"You'll get him this time for sure," you say, giving Cassius an encouraging smile and a thumbs up.

*show_if cassius_encouraged == true
"That's right!" Cassius replies with a broad grin. "That's the kind of attitude I like to see. Now, watch closely."

*show_if cassius_encouraged == false
You decide to keep your thoughts to yourself. Cassius gives you a satisfied nod and turns his attention back to the Chikorita, confident that he has your undivided attention.

The Chikorita watches him for a moment, swallows its clover, and turns away. A long green vine slips from the side of its neck, winds around a low branch, and tugs down another mouthful of leaves. It doesn't appear particularly concerned that either of you is there.

Encouraged by the Chikorita's apparent indifference, Cassius steps onto a flat stone near the ditch's edge. The stone tips beneath his weight. He catches himself against a fence post, but one boot plunges into the ditch up to his ankle. The Chikorita stops chewing momentarily and looks over at him, wholly unimpressed by its would-be captor. Then, without showing the slightest concern, it turns and wanders over to a small opening in the hedge before pushing its way through the branches.

Cassius swears loudly.

"That," he says, "was a sound approach until the stone moved." He pulls his foot free with an unpleasant sucking sound and looks down at his boot with the most downtrodden look you've ever seen on a man's face. 

*page_break

You follow the irrigation channel west until you reach the stone bridge, then cross into the orchard where the Chikorita disappeared. An old farm track runs between the rows of trees, its surface uneven from years of wagon wheels and rainwater. Cassius walks beside you with one wet sock squelching in his boot. You try your best to ignore the gross sound.

Your employer, the Aurelian League, issued you both a collection kit this morning: a canvas shoulder bag containing thick protective gloves, a packet of approved Pokémon treats, a first-aid kit, and a handheld scanner for checking identification tags. A net is strapped to one side of the bag, while a lightweight, collapsible carrier is secured to the other. The Chikorita hasn't allowed either of you close enough to use the scanner, and it hasn't been interested in the treats. You suggested calling someone with a trained partner Pokémon, but Cassius said it would be embarrassing to ask for assistance with something this straightforward.

According to the assignment notice, the League recently purchased several parcels of abandoned farmland outside Lezano, with plans to build a new Pokémon Gym and adjoining training grounds. Before construction can begin, the surrounding area needs to be surveyed and any wild Pokémon living there safely relocated. It's a fairly routine part of land development, and the League has assured local residents that every Pokémon collected will be transferred to a suitable habitat elsewhere in the region. Your job today is to bring in a particularly uncooperative one.

Eventually, the orchard gives way to a stretch of overgrown farmland. The track curves around a small rise before opening onto a grassy clearing, where an abandoned stone shed stands beside what must once have been a storage yard. Its weathered wooden door hangs crooked in its frame, and several pieces of rusting farm equipment lie scattered nearby. A low stone wall separates the old yard from the track, running along the front of the property before stopping a few feet short of the shed. The opening beside the door provides the only easy way inside, though several sections of the wall have begun to crumble. Grass and wildflowers have overtaken most of the yard, and there doesn't seem to be much left worth storing.

The Chikorita is there, closely examining a patch of wildflowers inside the old yard. Its small green body is scarcely visible among the grass, though the ridiculously large leaf on its head gives it away each time it moves. How would evolution create such a dumb-looking creature?

But then you remember hearing about a Pokémon that looks like an ice cream cone...

You signal to Cassius, and he quickly crouches behind the low wall beside you. From here, you can see most of the small yard without exposing yourselves to the Chikorita. Cassius peers through a gap in the stones, watching the Pokémon as it noses around the wildflowers. His eyes move between the Chikorita and the open ground surrounding it, and you can almost see him working through another elaborate plan. After a few seconds, he reaches into his pocket, removes a half-eaten breakfast roll, and carefully places it on a flat rock just beyond the wall.

*choice
#Remind Cassius that bread isn't on the approved feeding list. -> bread_result [set bread_response "caution"]
#Ask whether he's planning to share his entire lunch. -> bread_result [set bread_response "tease"]

*passage bread_result
*title An Unconventional Approach
*hide_title

*show_if bread_response == "caution"
"That's not on the approved feeding list," you whisper.

*show_if bread_response == "caution"
Cassius glances at you and presses a finger to his lips. "It's plain bread," he whispers. "Plenty of Pokémon eat bread. In wildlife management, you've gotta know when and where to bend the rules to get the job done."

*show_if bread_response == "tease"
"Planning to give him the rest of your lunch, too?" you whisper.

*show_if bread_response == "tease"
"Hey, if it works," Cassius replies, looking entirely serious. "A good field warden has to be willing to make sacrifices. Granted, I was looking forward to finishing that roll, but sometimes you've got to put the job first."

Before you can say anything else, a long green vine shoots up from the patch of wildflowers. It sways for a moment, then stretches toward the rock, feeling around until it finds the breakfast roll. In a flash, the vine curls around the bread and retracts into the patch with its prize. You didn't even see the Chikorita.

Cassius stares at the now-empty rock, dumbfounded, as you both hear the unmistakable sound of chewing, followed by a pleased little chirp.

"Well," he says, slowly rising from his crouch, "it took the bait. So that's pretty clear progress, I'd say."

The Chikorita lifts its head and looks directly at Cassius. Its eyes drift toward the empty rock, then back to his hands. Cassius reaches for the net strapped to the collection kit, then pauses.

"Now, if you're thinking of mentioning the bread in the report, I'd prefer you didn't. There's really no need to complicate reporting a successful recovery, ya know what I mean? I've got five kiddos, and the last thing I need is someone from the office asking why I gave a Pokémon half a breakfast roll."

*choice
#Assure Cassius you won't mention the bread. -> report_result [set report_response "reassure"]
#Tell him the report should be accurate. -> report_result [set report_response "honest"]

*passage report_result
*title An Unconventional Approach
*hide_title
*if report_response == "reassure"
  *add cassius_relationship 1
*else
  *add cassius_relationship -3

*show_if report_response == "reassure"
"Don't worry. Your secret is safe with me," you assure him.

*show_if report_response == "reassure"
"Good," Cassius replies, looking relieved. "I knew you were good people." 

*show_if report_response == "honest"
"I think we should probably just write down what happened," you tell him. "That's what the reports are for, isn't it?"

*show_if report_response == "honest"
Cassius winces. "Well, yes, technically. But there's a difference between keeping an accurate record and inviting some admin who doesn't have enough to do to question your methods when you didn't do anything wrong." He sighs. "But fine. If you feel that strongly about it, we'll document that I gave a hungry creature a bit of bread so that we could relocate it to a safer place."

Cassius turns his attention back to the Chikorita and adjusts his grip on the net. He leans forward slightly, preparing to make another attempt.

"So, five kids, huh? Wow. How are they all doing?" you ask, partly because you're genuinely interested, but mostly because you'd rather not watch him charge across the clearing with a net and hurt himself.

Cassius's attention leaves the Chikorita almost immediately. "Oh, they're doing fine. Keeping us busy, as usual. My youngest has taken to hiding things in people's shoes. Found my house keys in one of my boots yesterday."

"At least you found them before leaving for work."

"Yeah, but I couldn't really leave without them anyway." He chuckles. "And one of the older ones has an important exam coming up. Studying every evening, poor thing, with the other four making enough noise to wake the neighbors. It's a circus. And now they're all arguing about what Pokémon we ought to adopt. One wants a Growlithe, another wants an Eevee, and the youngest insists we need an Onix."

"An Onix? Where would you even keep it?"

"That's what I asked! He claims the garden's big enough if we move the shed." He shakes his head, still smiling. "My wife told them we can discuss it when they agree on something that fits through the front door."

"Sounds like she's the sensible one."

"Someone has to be," he agrees. "Between you and me, I wouldn't mind a Growlithe myself. Always liked them. But with five kids in the house, I think I'd better let my wife have the final say on that particular decision."

*page_break

While he talks, the Chikorita slips out of the flowers and begins following the inside of the low wall toward the opening beside the shed. You notice it first. Cassius sees your expression and turns just as the Pokémon reaches the end of the wall.

Without a word, he takes off after it. You're genuinely surprised at how quickly the man can move for someone his age. He covers the distance in a few seconds, reaching the opening just as the Chikorita approaches from the other side. He bends down to grab it, but his jacket brushes against the shed's old wooden doorframe and catches on something, bringing him to an abrupt stop.

There's a sharp ripping sound, and Cassius looks over his shoulder to discover that the back of his jacket has caught on a rusty nail protruding from the frame. He gives it a frustrated tug, which only makes the tear worse.

The Chikorita, meanwhile, has stopped walking. It turns toward Cassius and approaches him through the narrow opening. He freezes as the Pokémon stretches its neck toward him. For a moment, you think it might actually let him pick it up. It sniffs at his sleeve, then at his muddy boot.

"That's it," Cassius murmurs, easing one hand toward the Chikorita. "Come on, fella. We're not going to hurt you."

The Chikorita leans forward to sniff Cassius's outstretched fingers. He holds dead still, waiting for it to come a little closer. For a moment, things are looking promising. Then the Pokémon loses interest, walks past him, and continues down the farm track. Cassius gives his jacket another frustrated tug, but the nail refuses to let go.


*choice
#Help Cassius get his jacket free. -> shed_result [set shed_response "help"]
#Go after the Chikorita before it gets away. -> shed_result [set shed_response "chase"]

*passage shed_result
*title Another Minor Setback
*hide_title

*show_if shed_response == "help"
"Hold still a second," you tell Cassius, walking over to inspect the damage. The nail has caught a fold of fabric near his shoulder, and it's bent in such a way that every time he tries to pull away, it digs a little deeper. You carefully work the material loose while Cassius watches over his shoulder.

*show_if shed_response == "help"
"Much obliged," he says when you finally free him. He twists around to examine the tear, which is now large enough to fit several fingers through. "Well, that's unfortunate. I've had this jacket for years."

*show_if shed_response == "help"
"You could probably get it repaired," you suggest.

*show_if shed_response == "help"
"Oh, certainly. The question is whether I can get it repaired before my wife sees it. It was a birthday gift from her." He gives you a grateful pat on the shoulder before looking down the track. "Right, then. Where's our little friend gotten to?"

*show_if shed_response == "help"
You look down the farm track and spot the Chikorita investigating a clump of weeds beside the fence. "It's still right there," you tell him. "Why don't I keep an eye on it while you get yourself sorted out?"

*show_if shed_response == "help"
"Good thinking. I'll catch up with you in a minute," Cassius replies, inspecting the damage to his jacket again. You leave him attempting to tuck the torn fabric back into place and head down the track, keeping the Chikorita in sight. The Pokémon seems happy to continue its leisurely exploration, occasionally stopping to sniff something growing along the roadside. You maintain a comfortable distance, careful not to startle it or give it another reason to wander off.


*show_if shed_response == "chase"
"I'll go after it!" you call and take off at a jog down the track.

*show_if shed_response == "chase"
"Hold on! Don't scare it!" Cassius calls after you. You glance back just long enough to see him struggling with his jacket. He finally manages to pull himself free with another unpleasant ripping sound. "And don't get yourself hurt!"

*show_if shed_response == "chase"
You slow to a brisk walk as you approach the Chikorita. It glances back at you, apparently curious about your sudden interest in following it without your partner, but it makes no effort to run. You try speaking to it in a friendly voice. The large leaf twitches, and for a moment it looks as though it might actually approach you.

*show_if shed_response == "chase"
Then a loud voice carries down the track behind you. "That's good! Keep it calm! I'm coming!"

*show_if shed_response == "chase"
The Chikorita turns toward the noise, and you close your eyes in frustration. You can't help wondering how Cassius has managed to stay employed as a field warden for so many years. He's spent most of the morning falling into ditches, getting caught on things, and very loudly announcing his presence to every living thing within half a mile. 

*show_if shed_response == "chase"
Maybe he's usually much better at his job and today just isn't his day. You certainly hope so, because the alternative raises some serious questions about the League's hiring standards.

*show_if shed_response == "chase"
The Chikorita doesn't appear particularly bothered by the commotion behind it. It continues down the farm track at an unhurried pace, occasionally stopping to investigate a patch of grass or nibble at something growing along the roadside. You follow at a comfortable distance, keeping your movements slow and giving it plenty of room. After everything that's happened this morning, you've begun to suspect that the best way to catch this particular Pokémon might be to stop trying so hard.

*page_break

The track gradually slopes downhill between two neglected fields, where tall grass has grown up around the remains of old wooden fences. You hear water running from somewhere nearby. A little farther ahead, the path passes through an open gate and into a broad pasture dotted with wildflowers. Just inside the gate stands an old stone watering trough, and as you get closer, you see that it's fed by a narrow stream of water from a rusted iron pipe.

The Chikorita wanders over, peers into the water, and lowers its head to drink. Its enormous leaf hangs over the edge of the trough, occasionally dipping into the water as it moves.

You stop several yards away and watch. The Chikorita has been perfectly happy to let you watch it eat all morning, and now it's contentedly drinking from the trough. Getting close enough to catch it, however, has proven considerably more difficult. Perhaps you've been going about this the wrong way. Rather than trying to catch it by surprise, you wonder whether it might be better to let the Pokémon approach you on its own terms.

You're still considering how to manage that when you hear footsteps crunching against the gravel behind you, accompanied by the familiar sound of Cassius breathing rather heavily. He comes to a stop beside you, plants his hands on his hips, and spends a few moments looking out across the pasture while he catches his breath.

"Well," he says between heavy breaths, "at least it hasn't gone far."

You glance over at him and take a moment to appreciate just how thoroughly the morning has defeated him. His hair, which had been neatly combed when you left Lezano, is sticking up in several directions, and there's a long smear of dried mud down one leg of his pants. His boots are filthy, one of his socks is still wet, and the tear in his jacket has grown large enough that you can see the shirt underneath. He somehow also has a small twig caught in his collar, though you have no idea where that came from.

Cassius notices you looking and glances down at himself. He brushes some dirt from his jacket, discovers the twig, and tosses it aside before making a halfhearted attempt to straighten his collar. After a moment, he gives up and looks back at you with a weary smile.

"Quite a morning, eh?"

You look from him to the Chikorita, which is still enjoying a pleasant morning by the watering trough.

You nod. You can't really argue with that.

*choice
#Ask whether it's safe for the Chikorita to drink from such a rusty pipe. -> trough_response [set trough_question "water"]
#Ask why the Chikorita doesn't seem particularly afraid of either of you. -> trough_response [set trough_question "behavior"]

*passage trough_response
*title By the Watering Trough
*hide_title

*show_if trough_question == "water"
"Is that water actually safe for it to drink?" you ask, nodding toward the trough. "That pipe looks like it's been rusting away for decades."

*show_if trough_question == "water"
Cassius studies the pipe for a moment. "Well, rust on the outside doesn't necessarily mean the water's bad. Looks like it's coming from somewhere farther uphill, and there's a steady flow through it." He scratches his chin. "Still, I'd want to know where it's coming from before I'd call it safe."

*show_if trough_question == "water"
He pauses, then adds, "I definitely wouldn't recommend drinking any yourself."

*show_if trough_question == "water"
You arch an eyebrow. Does he think you have plans to drink from a rusty pipe?

*show_if trough_question == "behavior"
"Isn't it strange that it doesn't seem afraid?" you ask. "It walked right up to you back at the shed. It even came close enough to sniff your hand."

*show_if trough_question == "behavior"
"Why should it be afraid?" Cassius asks. "It's spent the entire morning making fools out of us without even trying. I'd say it can outsmart just about anything that comes along trying to catch it."

*show_if trough_question == "behavior"
He pauses, glancing down at his general state of being. "Present company included."

Cassius turns his attention back to the Chikorita. He studies it for a moment, then glances at the kit you're carrying. His expression grows thoughtful.

"Tell you what," he says. "Why don't you have a go?"

You look at him.

"Go on. I've been doing most of the work so far, but there's no shame in letting the junior warden get some practice." He gestures toward the Chikorita. "It's important you learn to handle these situations yourself. Can't have me doing everything for you, now can we?"

You shrug. "Sure, why not?"

"That's the spirit!" Cassius says, giving you an encouraging pat on the shoulder. "Just remember what I told you about patience. Don't rush it."

You turn your attention to the Chikorita. It's finished drinking and is now investigating a small cluster of flowers growing between the stones at the base of the trough. It seems content to ignore the two of you for the moment.

You've watched Cassius try several different approaches this morning, with limited success. Perhaps you'll have better luck.


*choice
#Gather some fresh clover and try to coax the Chikorita closer. -> capture_attempt [set capture_plan "clover"]
#Sit down near the Chikorita and try to earn its trust. -> capture_attempt [set capture_plan "carrier"]

*passage capture_attempt
*title A Different Approach
*hide_title

*show_if capture_plan == "clover"
You remember how eagerly the Chikorita ate the clover by the irrigation ditch. There's plenty growing along the edge of the pasture, so you gather a small handful and pull on your protective gloves. Then you approach the watering trough slowly, stopping several feet away before crouching down and offering the leaves in your open palm.

*show_if capture_plan == "clover"
The Chikorita lifts its head from the flowers. Its eyes move from your face to the clover, and the enormous leaf on its head gives a little twitch. For a moment, it simply watches you.

*show_if capture_plan == "clover"
The Chikorita takes a few cautious steps toward you, then stops. A long green vine emerges from among the small buds around its neck and stretches toward your open palm. The Pokémon remains where it is as the vine reaches the clover, brushing against your fingers before curling around several leaves.

*show_if capture_plan == "clover"
You had hoped it would come closer on its own, but after watching Cassius lose half his breakfast to the same trick, you can't say you're surprised. The vine takes a few pieces of clover and withdraws, leaving you with a considerably smaller handful.

*show_if capture_plan == "clover"
The creature chews thoughtfully, watching you the entire time. When it finishes, it glances at your hand again. You offer what's left, and this time it approaches without bothering to use its vine. It sniffs your fingers before taking a mouthful of clover directly from your palm.

*show_if capture_plan == "clover"
You can hear Cassius moving, but thankfully he doesn't interrupt. The Chikorita continues eating, occasionally glancing up at your face before returning its attention to the clover. You decide to give it another minute before attempting anything else.

*show_if capture_plan == "carrier"
You unfasten the folded carrier from the collection kit and carry it toward the watering trough. The Chikorita watches you approach, but doesn't move away. You find a level patch of grass a few feet from the trough, unfold the carrier, and lock its frame into place before opening the door. Then you sit down beside it, making yourself as comfortable as possible since you have no idea how long this might take.

*show_if capture_plan == "carrier"
Cassius watches you for a moment before wandering over and crouching beside you. "All right, so what's the plan here? You're not expecting it to just wander into that thing by itself, are you?"

*show_if capture_plan == "carrier"
"No," you whisper, shaking your head. "I thought I'd see if I could get it comfortable enough to let me pick it up."

*show_if capture_plan == "carrier"
"Ah, interesting plan!" Cassius says approvingly, though he makes no effort to lower his voice. You give him a sharp look, and he quickly adds, in a much quieter tone, "Right. Sorry. I'll leave you to it."

*show_if capture_plan == "carrier"
He retreats several yards down the track while you turn your attention back to the Chikorita. It's watching you now, apparently curious about why you've decided to sit in the grass. You pull on your protective gloves, gather a few pieces of clover growing nearby, and hold them out on your open palm.

*show_if capture_plan == "carrier"
For the first few minutes, the Chikorita pays you very little attention. It occasionally glances in your direction, but seems far more interested in the wildflowers growing around the watering trough. You stay where you are, resting your gloved hand on your knee with the clover held loosely between your fingers. Every so often, you catch it looking at you, only for it to turn away again the moment you meet its eyes.

*show_if capture_plan == "carrier"
Eventually, the Chikorita abandons its inspection of the flowers and wanders closer. It stops several feet away, watching you with its head tilted to one side. You hold out your hand, allowing it a better look at what you're offering, but make no attempt to reach for it. The Chikorita takes another few steps, pauses, and stretches one of its vines toward the clover. It gives the leaves a cautious prod before withdrawing the vine again.

*show_if capture_plan == "carrier"
You remain still as the Chikorita approaches close enough to sniff your fingers. Its enormous leaf sways gently above its head while it examines the clover. It noses the leaves once, then leans forward and takes a small bite from your hand.

*show_if capture_plan == "carrier"
You hear Cassius shifting behind you, but thankfully, he has the good sense to remain quiet. The Chikorita takes another bite, then a third. It no longer hesitates between mouthfuls, and when you shift your hand slightly to make the remaining clover easier to reach, it simply follows the movement. You consider reaching out with your free hand to stroke its head, but decide against it. You've spent the better part of the morning chasing this little Pokémon around the countryside, and you'd rather not ruin the first real progress you've made by startling it now.

Eventually, the last of the clover disappears into its mouth. The Chikorita sniffs your empty palm, gives it a more thorough inspection, then looks up at you. You get the distinct impression that it's wondering where its lunch has gone.

"Well, that's encouraging," Cassius whispers from behind you.

You glance back at him. He's watching with considerable interest, though you suspect he'd rather not admit how much better things are going now that he's left this up to you.

"Think you can pick it up?" he asks.

You look back at the Chikorita. It's standing right beside you, close enough that you can feel its leaf brush against your arm whenever it moves.

You slowly lower your free hand toward its side. The Chikorita notices immediately, turning its head to examine your glove. You stop moving and let it sniff your fingers before gently resting your hand against its body.

It doesn't pull away.

Encouraged, you carefully slide one hand beneath its chest and bring the other around to support its body. The Chikorita gives a startled little cry as its feet leave the ground, and a vine curls around your wrist. For a moment, you think it's going to struggle free, but you keep your grip gentle and steady.

"Easy now," you murmur. "I've got you."

The Chikorita twists its head to look at you. Its small feet fidget against your gloves, and the vine around your wrist tightens slightly, but thankfully, it doesn't try to attack. A Razor Leaf attack at this distance could leave you with some nasty cuts, and you'd rather not find out just how much protection your gloves provide. Especially since you have absolutely nothing protecting your face.

*page_break

"Would you look at that!" Cassius says, sounding genuinely impressed. "You've got it!"

*show_if capture_plan == "clover"
Cassius retrieves the folded carrier from the collection kit and quietly sets it up on the grass beside you. He locks its frame into place, opens the door, and holds it steady.

*show_if capture_plan == "carrier"
Cassius approaches and kneels beside the carrier you've already set out. He pulls the door open a tad wider and holds it steady.

"All right," he says quietly. "Let's get our friend settled in."

You turn toward the carrier, adjusting your grip so you can lower the Chikorita onto the padded floor. It watches your movements without much concern at first, but as you bring it closer to the opening, its attention shifts to the small enclosure. It cranes its neck to peer inside, and for a moment, its entire body goes still.

Then, without warning, the Chikorita begins writhing in your hands. Its little feet push against your gloves, and the vine around your wrist suddenly pulls tight. It lets out a sharp, frightened cry, twisting desperately to get away from the carrier.


"Whoa, easy!" Cassius says, reaching out to steady the carrier. "Careful there!"

You hesitate, alarmed by how fiercely the Chikorita is struggling. For a moment, you consider just dropping it back on the grass, but Cassius is holding the carrier steady, and you tell yourself it will be safer to put the Pokémon down on the padding than risk hurting it while it squirms in your arms.

You adjust your grip, taking care not to squeeze its body or catch the enormous leaf on its head. The Chikorita twists again, trying to pull itself away from the opening, and you can feel its little heart beating rapidly beneath your gloved hand.

"Almost there," Cassius says. "Just lower it in gently."

You manage to guide the Chikorita into the carrier and withdraw your hands. It immediately turns toward the opening, a sad look of betrayal in its eyes, but Cassius closes the door before it can escape.

For several seconds, the Pokémon presses against the mesh. A vine slips through one of the openings and feels along the edge of the door, searching around the latch before withdrawing.

You watch it with a growing sense of unease.

"Well!" Cassius says, sitting back on his heels. "There we are. Successful recovery!"

He gives the carrier an approving pat and rises to his feet, brushing grass from his pants.

Inside, the Chikorita has stopped struggling. It sits near the back of the carrier, watching the two of you through the mesh.

"Don't worry about it fussing," Cassius tells you. "Most wild Pokémon don't appreciate being put in a box. It'll settle down once we get moving."

You hope he's right.