*var trainer_name "Unknown"
*var pronouns "They / Them"
*var pronouns_subject "they"
*var pronouns_object "them"
*var pronouns_possessive "their"
*var pronouns_possessive_pronoun "theirs"
*var pronouns_reflexive "themself"
*var use_plural_verbs true
*var starter_species ""
*var starter_nickname ""
*var lucia_topic "none"
*var ferry_encounter "none"
*stat trainer_name "Trainer name"
*stat pronouns "Pronouns"
*pokemon starter_charmander "Charmander"
*pokemon starter_chikorita "Chikorita"
*pokemon starter_piplup "Piplup"

*chapter The Crossing

*passage ferry
*title Approaching Lezano

The ferry has been underway since very early this morning, and by now you've grown accustomed to the gentle vibration of its engines beneath your feet. Sunlight streams through the passenger lounge's wide windows, catching on the polished floors and the occasional glassware on the many tables. The air smells wonderfully of fresh coffee and warm breakfast rolls. Unfortunately, every seat in the lounge is occupied, and the little café near the stairs has a line stretching almost to the door. Even if you were to treat yourself to something delicious, you'd have nowhere comfortable to sit and enjoy it.

A few passengers have made themselves at home on the floor, sitting cross-legged beside their luggage or leaning against the walls with their breakfast balanced on their knees. Others have given up on finding seats altogether and gathered around the windows, hoping to catch their first glimpse of the Aurelian coastline. Despite the crowd, the atmosphere is cheerful, and conversations overlap with the occasional burst of laughter, and you even hear a group of trainers having a spirited discussion about which starter Pokémon they hope to receive.

Of course, there's a good reason for all the excitement. Everyone aboard is traveling to Lezano for the inaugural season of the Aurelian League, and some have come from halfway around the world for the opportunity. Only one hundred contestants were accepted, and somehow, you're one of them. The whole thing has been so wonderfully unexpected that part of you wonders whether there might have been some kind of mistake.

After all, you only received your Pokémon Trainer license last week.

Yet here you are, aboard a ferry full of aspiring trainers, with your luggage packed and your future waiting somewhere on the other side of the water. And perhaps the most exciting part is that, by the end of today, you'll finally have a Pokémon partner of your very own.

*page_break

The television mounted above the café counter is playing the same advertisement for what must be the eighth time since you boarded. A cheerful little tune accompanies a sweeping aerial view of Aurelia, beginning with its sunlit coastline before moving inland over green hills, sprawling forests, and picturesque towns. Eight golden Laurels appear one after another across the screen, accompanied by the familiar voice of the presenter.

"One hundred contestants. Eight Laurels. Three Finalists. One Champion!" she announces enthusiastically, before promising viewers an unforgettable season of adventures, challenges, and discoveries. The advertisement ends with a glimpse of the Grand Amphitheater, where the three highest-ranked contestants will compete for the title of Aurelian Champion.

You hear some grumbling behind you, and you glance over your shoulder and find two young men around your age standing beside a stack of luggage, apparently having a disagreement. "I'm serious. How are we supposed to prepare for eight challenges when nobody will tell us what they are? What if one of them involves swimming? I can't swim!"

His friend laughs and reminds him that discovering things is supposed to be part of the adventure, which only seems to irritate him further. Before long, their discussion turns to whether someone could realistically become Champion without winning a single Pokémon battle. A woman waiting in line for coffee insists that battling is probably the easiest way to earn points, while another passenger argues that the League wouldn't have made such a fuss about its unusual rules if that were true.

You decide to find somewhere a little quieter and make your way toward the windows, carefully stepping around bags and apologizing to a man whose newspaper you've nearly knocked out of his hands. Outside, the morning sun has climbed high enough to scatter little points of light across the water, and the coastline is finally coming into view. You can just make out the pale buildings of Lezano clustered around its harbor, with green hills rising behind them. A few Wingull circle overhead, occasionally dipping toward the water before climbing back into the breeze. You've seen photographs of the city, of course, but they're hardly the same as seeing it in person. Somewhere over there, your first Pokémon friend is waiting to meet you!

*page_break

The ferry makes a gentle turn, causing a paper cup to roll across the floor and bump against someone's shoe. Its owner, a young woman wearing a bright orange jacket, catches it before it can travel any farther. She bends to retrieve it, deposits it in a nearby trash can, and brushes a loose strand of brown hair away from her face. When she notices you standing by the window, she follows your gaze toward the approaching coast. Her expression brightens, and after a moment she makes her way over.

"Pretty exciting, isn't it?" she says, joining you at the window. "I was going to head up to the observation deck, but I think half the ferry had the same idea and I don't want to try to fight that crowd. But it looks like we can see the harbor perfectly well from here."

She leans forward to get a better view. A small Wingull charm hangs from the zipper of her bag, swinging against the bright orange fabric of her jacket. "I was starting to think we weren't going to see land until lunchtime. I've already eaten everything I brought for the trip, and I made the mistake of looking at the prices in the café."

You laugh, and she grins back. There's something reassuring about meeting another contestant who's more concerned about breakfast than the rankings on the television. "Sorry, I should introduce myself. I'm Lucia. I'm here for the League, obviously. You are too, right?"

*continue name

*passage name
*title A Fellow Contestant

When you confirm that you're entering the competition, Lucia looks pleased. "I thought so! It's just that there are a few ordinary passengers aboard, and I've already made the mistake of asking one of them what starter they're hoping to get. He was very confused." She laughs at the memory and adjusts the strap of her bag. "Have you met many people yet? I keep thinking that we're going to spend months seeing the same faces, so we might as well get acquainted while we have the chance."

She holds out a hand. "Anyway, what should I call you? Just your first name, please. That's what I'll remember, and we can leave the full names and all that official business for the registration desk."

*input_text trainer_name "Your first name" -> pronouns

*passage pronouns
*title Getting Acquainted

"${trainer_name}," Lucia repeats, with a cheerful nod. "It's nice to meet you properly." She takes her phone out of her jacket pocket and opens a contact card. Apparently, she's serious about remembering the people she meets. A small collection of other names is already waiting in her contacts, although she laughs when you notice and admits that she's only been brave enough to introduce herself to a handful of people so far.

"Oh, I should ask something else before I forget," she says. "I use she and her. What pronouns do you use? I don't want to spend the whole journey getting that wrong."

*choice
#He / Him -> he
#She / Her -> she
#They / Them -> they

*passage he
*title A New Acquaintance
*set pronouns "He / Him"
*set pronouns_subject "he"
*set pronouns_object "him"
*set pronouns_possessive "his"
*set pronouns_possessive_pronoun "his"
*set pronouns_reflexive "himself"
*set use_plural_verbs false

Lucia nods, finishes entering your details, and puts her phone away. "There we go. If I see you wandering around Lezano later, I'll know who to shout for. Although with a hundred contestants running around, you'll probably have to shout back a few times before I hear you."

She looks out at the approaching city again. "Actually, ${trainer_name}, since we're talking, can I ask you something?"

*continue lucia_chat

*passage she
*title A New Acquaintance
*set pronouns "She / Her"
*set pronouns_subject "she"
*set pronouns_object "her"
*set pronouns_possessive "her"
*set pronouns_possessive_pronoun "hers"
*set pronouns_reflexive "herself"
*set use_plural_verbs false

Lucia nods, finishes entering your details, and puts her phone away. "There we go. If I see you wandering around Lezano later, I'll know who to shout for. Although with a hundred contestants running around, you'll probably have to shout back a few times before I hear you."

She looks out at the approaching city again. "Actually, ${trainer_name}, since we're talking, can I ask you something?"

*continue lucia_chat

*passage they
*title A New Acquaintance
*set pronouns "They / Them"
*set pronouns_subject "they"
*set pronouns_object "them"
*set pronouns_possessive "their"
*set pronouns_possessive_pronoun "theirs"
*set pronouns_reflexive "themself"
*set use_plural_verbs true

Lucia nods, finishes entering your details, and puts her phone away. "There we go. If I see you wandering around Lezano later, I'll know who to shout for. Although with a hundred contestants running around, you'll probably have to shout back a few times before I hear you."

She looks out at the approaching city again. "Actually, ${trainer_name}, since we're talking, can I ask you something?"

*continue lucia_chat

*passage lucia_chat
*title An Unusual Beginning
*journal met_lucia "You met Lucia aboard the ferry to Lezano. She is looking forward to traveling across Aurelia and meeting Pokémon."

"Does it feel strange to you, coming here without a Pokémon?" Lucia asks. "I know the League wants everyone to begin with a new partner, and I understand why, but the whole ferry feels a little empty. Back home there's almost always a Pokémon nearby. My family has a Floatzel who's convinced that nobody can be trusted to walk along the shore without his supervision. Even the postman gets an escort."

She has a story about the Floatzel stealing her brother's boots and dragging them into a rock pool, which leads to another about how he once followed her all the way to the market. You've barely known Lucia for five minutes, and already you have a fairly good picture of what life in her household must be like. For all her enthusiasm, though, she admits that she has never raised a Pokémon entirely on her own. "Helping with one you've known all your life is one thing. Starting from the beginning with somebody you've only just met is going to be different. I hope I can make a good first impression."

Beyond the window, another stretch of coastline comes into view. Lucia stops talking for a moment to watch it, then catches herself and laughs. "Sorry. I warned myself I wouldn't spend this trip talking everyone's ears off, and here I am doing exactly that. Is there anything you wanted to know? I've read the entrant guide so many times that I might actually be useful for something."

*choice
#Ask Lucia why she decided to enter the League -> lucia_wildlife
#Ask what she knows about the Laurels -> lucia_rules
#Ask whether she's nervous about the competition -> lucia_nerves
#Tell her you'd like to look around before docking -> open_deck

*passage lucia_wildlife
*title A Whole Region to Explore
*set lucia_topic "wildlife"

"Well, the Pokémon, for one thing," Lucia says, as though the answer should be obvious. "I want to see the kinds of places they live when people aren't building roads and houses all around them. There are wetlands in the north, and old forests, and islands you can only reach by boat. I've been reading about Aurelia for months. If I can travel all over the region and help Pokémon along the way, I don't think I'll mind whatever else the League asks of us."

She taps the Wingull charm on her bag. It was a gift from her younger brother, who made her promise to send him photographs of every Flying-type she encounters. "He's decided I'm going to become a famous conservationist. My parents are hoping I'll come home with some kind of sensible career plan. Personally, I'd settle for getting through the first week without losing my luggage."

She turns back to the window, where a fishing boat is crossing the ferry's path some distance away. "What about you? No, wait, you don't have to answer that right now. We've still got an entire region to find out what we're doing in." A bell sounds faintly from the passageway, and she glances toward the stairs. There may still be time to meet someone else before the ferry docks.

*continue open_deck

*passage lucia_rules
*title Eight Laurels
*set lucia_topic "rules"

"Oh, I can tell you what the guide says," Lucia replies, pulling out her phone. "We have to earn eight Laurels before the season ends. They're supposed to recognize things such as courage, compassion, good judgment, that sort of thing. Pokémon battles are allowed, but they're not required, which is lovely for anybody who doesn't want to spend the whole journey looking for a fight. The three highest-ranked people who earn all eight get into the Triumvirate. It's not just a race to finish first."

She scrolls through several pages and makes a dissatisfied noise. "What it doesn't tell us is how they'll decide which accomplishments are better than others. One person could help a village repair a bridge, and another could rescue a lost Pokémon. How would you compare those? I suppose there must be judges, and the rankings must mean something, but there's not much here about how the points work."

She looks genuinely puzzled rather than suspicious. "Maybe they'll explain it during registration. It would be nice to know what we're being judged on before we start, wouldn't it?" She puts her phone away as an announcement crackles through the lounge, reminding passengers to collect their belongings before arrival. There's still a little time to look around.

*continue open_deck

*passage lucia_nerves
*title First-Day Nerves
*set lucia_topic "nerves"

"Terrified," Lucia admits, then laughs at your expression. "All right, maybe that's an exaggeration. But I've never been on television, and apparently there are going to be cameras everywhere. My mother keeps talking about recording every episode, and my little brother says he's going to watch with all his friends. I can already imagine myself tripping on the first day and having the whole world see it."

She adjusts the Wingull charm on her bag, suddenly a little more thoughtful. "And I'm worried about the Pokémon, too. What if the one I choose doesn't like me? Everybody talks about meeting a starter as though you're guaranteed to become best friends in five minutes. I know enough about Pokémon to know that trust takes time. I just hope I don't do something foolish before we've even learned each other's habits."

After a moment, she straightens and gives you a determined smile. "Still, I came all this way. It would be a shame to spend the whole season worrying about things that haven't happened yet." A bell sounds from the passageway, reminding passengers to gather their belongings before arrival. You still have a little time to look around.

*continue open_deck

*passage open_deck
*title A Little Time to Spare

Lucia glances at the clock above the café and realizes that she ought to retrieve the bag she left at her seat. She promises to look for you at the terminal, then heads back through the crowd with a cheerful wave. You're sorry to see her go, but it's nice knowing that at least one familiar face will be waiting when you arrive.

There's still some time before docking, and now that you've had one conversation, the room seems full of people you might want to meet. Near the wall opposite the café, a neatly dressed young man is comparing notes with a woman who has the League guide open on her phone. They seem to disagree about something. If you don't feel like introducing yourself, you could listen from nearby and see what they're discussing. The stairs to the observation deck are another possibility, and the breeze outside might be a welcome change after so much time in the crowded lounge.

*choice
#Introduce yourself to the two contestants -> group_join
#Stay nearby and listen without interrupting -> eavesdrop
#Go up to the observation deck instead -> rail

*passage group_join
*title Dario and Ilaria
*set ferry_encounter "conversation"
*journal met_dario "You introduced yourself to Dario, a contestant who is studying the League's rankings."
*journal met_ilaria "You met Ilaria, a contestant concerned about how the League will judge its challenges."

The young man looks up when you approach, and the woman beside him closes the guide on her phone. "Hello! You're entering too, I take it?" he asks. "I'm Dario, and this is Ilaria. We're trying to make sense of the ranking rules. Or rather, I'm trying to make sense of them, and Ilaria keeps telling me I'm reading too much into everything." He offers you a handshake and, before you've even finished introducing yourself, points to a paragraph in his notebook.

"He's decided there's a secret formula for winning," Ilaria says with a small smile. "I think the judges will have to make a lot of decisions that aren't quite so straightforward. You can't put a number on every good thing someone does, and the guide doesn't explain how they're planning to try." She nods toward the television, where another advertisement has just begun. "It makes for an exciting show, though. I suppose that's part of what they're trying to do."

Dario takes the teasing in good humor. "I don't think it's wrong to want to know the rules. I didn't come all this way to be eliminated because I misunderstood something I could have learned on the ferry. And yes, I want to win. I imagine most of us do, even if people are being polite about it." He glances at you, curious about your reaction, but doesn't press you for an answer. Instead, he shows you the sections he's marked and gives you a chance to read for yourself.

You spend several minutes comparing what little you've all managed to learn. Dario has collected an impressive amount of information, while Ilaria seems more interested in what the official guide leaves unexplained. Neither has settled on a starter yet. When the ship's engines change pitch, the conversation breaks up naturally, and you agree that you might see one another again in Lezano.

*continue dock_approach

*passage eavesdrop
*title Something to Think About
*set ferry_encounter "eavesdrop"
*journal heard_ranking_doubt "You overheard Dario and Ilaria questioning how the League's rankings are determined."

You stop near the noticeboard and make a show of reading the arrivals timetable. The two contestants are speaking quietly, but their voices carry well enough for you to hear. "I've gone over the guide three times," the young man says. "Eight Laurels, a final ranking, and only three places in the Triumvirate. There has to be some way to work out which challenges are worth more. If we can understand that, we can decide where to put our effort."

"You're assuming that everything can be measured that way, Dario," the woman replies. "What happens when two people solve the same problem differently? Suppose one person helps a frightened Pokémon get home, and another gets into a battle to protect it. Are those worth the same? Does it matter whether the Pokémon was actually in danger? Ilaria isn't asking you to give up on winning. I'm asking you to think about what winning is supposed to mean." She stops, seems to realize she's spoken of herself in the third person while repeating an argument they've clearly had before, and shakes her head with an embarrassed laugh.

Dario laughs too, though he isn't convinced. "I know what you mean. I just don't see the point in leaving all of that to chance." He begins to answer her example, but the loudspeaker interrupts with a reminder to gather luggage. They close their notebooks and move off toward the stairs, still talking. You haven't introduced yourself, but you've learned their names and a little about what each of them expects from the competition.

*continue dock_approach

*passage rail
*title The Observation Deck
*set ferry_encounter "quiet"

The stairwell is busy, but the observation deck is less crowded than Lucia feared. Most of the passengers have gathered along the forward rail, leaving a little space near the side of the ship. The breeze feels wonderful after the warmth of the lounge, and you take a long breath of fresh sea air before finding a place to watch the coast.

From up here, Lezano is much easier to see. Fishing boats drift in and out of the harbor, while passenger ferries and small cargo ships share the deeper channel beyond the breakwater. Pale buildings climb the streets above the waterfront, and a line of green hills rises behind the city. A few Wingull follow the ship, taking turns swooping past the railings and calling to the passengers.

One bold Wingull lands a short distance from you and eyes a boy's breakfast roll with interest. The boy tears off a piece, but a nearby deckhand gently asks him not to feed the wild Pokémon. After several hopeful cries, the Wingull gives up and flies off toward the harbor, where it joins several others circling above a fishing boat.

For a few peaceful minutes, you have nothing to do but watch the approaching city. Somewhere down there, the League is preparing to welcome one hundred contestants, and you've no idea what your first day will hold. The thought makes you smile. When the ferry sounds its arrival bell, you reluctantly turn away from the rail and head downstairs to collect your luggage.

*continue dock_approach

*passage dock_approach
*title The Harbor Ahead

By the time you return to the main deck, the ferry has slowed considerably. Through the windows you can see the stone quays of Lezano, crowded with people who have come to watch the contestants arrive. Red-and-gold banners hang from the terminal, and a large digital screen displays the Aurelian League emblem above the words WELCOME, CONTESTANTS!

*show_if ferry_encounter == "conversation"
Dario notices you joining the queue and raises a hand. Ilaria is beside him, carefully tucking her notebook into her bag. They both smile in recognition before the movement of the crowd carries them toward another door.

*show_if ferry_encounter == "eavesdrop"
Dario and Ilaria are standing a few places ahead of you, still discussing the ranking rules. Neither seems aware that you overheard their conversation, and you decide to let them carry on without interrupting.

*show_if ferry_encounter == "quiet"
The Wingull from the outer deck passes overhead just as you reach the windows. You follow it until it disappears among the fishing boats, pleased to have seen a little of Aurelia's wild Pokémon before even setting foot ashore.

*show_if lucia_topic == "nerves"
Lucia appears near the front of the line, looking back and forth between the people outside and the camera crew on the quay. When she catches your eye, she makes an exaggerated effort to stand up straight, then laughs at herself.

*show_if lucia_topic == "wildlife"
Lucia reappears with her bag and points excitedly toward a pair of Wingull perched on the harbor wall. She seems delighted to have found her first photographic subjects before the competition has officially begun.

*show_if lucia_topic == "rules"
Lucia rejoins you long enough to say that someone near the front has heard there will be a proper briefing after registration. She looks relieved that the questions in the entrant guide might finally be answered.

*show_if lucia_topic == "none"
Lucia spots you from farther along the queue and waves, clearly pleased that you haven't disappeared into the crowd for good.

A dull thump travels through the deck as the ferry reaches its berth. The engines fall quiet, and the crew begin securing the gangway. Outside, a pair of camera operators are filming the passengers through the windows, while League volunteers direct arrivals toward the terminal. You can see the line moving at last, and the people ahead of you begin lifting their bags.

You collect your luggage and join them. The doors open to let in a fresh breeze carrying the sounds of the harbor, and a volunteer calls out a cheerful welcome to Aurelia. With the other contestants moving around you, you step onto the gangway and make your way toward Lezano.

*continue arrival

*chapter Lezano

*passage arrival
*title Arrival in Lezano
*checkpoint
*journal arrived "${trainer_name} arrived in Lezano. {They} @{use_plural_verbs are|is} ready for a new partnership."

You step off the gangway into the noise of Lezano's waterfront. League volunteers in red jackets are directing contestants toward the registration center, while spectators call greetings from behind the barriers. Above the terminal doors, a digital sign welcomes the inaugural Aurelian League.

Lucia is somewhere in the stream of arrivals, along with everyone else you passed on the ferry. The crowd spreads out along the quay, each person following a different volunteer or trying to read the same cluster of signs.

For the first time since you boarded, the ground beneath your feet is still. You take a moment to look around before joining the line for registration. Your first Pokémon is waiting somewhere beyond those doors.

*continue starters

*passage starters
*title Meet the Starters

Charmander, Chikorita, and Piplup wait nearby. You can spend time with each before making your decision. All three are available to you.

*choice
#Examine Charmander -> examine_charmander
#Examine Chikorita -> examine_chikorita
#Examine Piplup -> examine_piplup

*passage examine_charmander
*title Meeting Charmander

Charmander turns toward you, the small flame on its tail glowing steadily.

You can choose Charmander or meet the other Pokémon first.

*choice
#Choose Charmander -> choose_charmander
#Keep looking -> starters

*passage choose_charmander
*title A New Partner
*set starter_species "Charmander"

Charmander is your choice. Would you like to give your partner a nickname?

*choice
#Keep the species name -> join
#Give a nickname -> nickname

*passage examine_chikorita
*title Meeting Chikorita

Chikorita lifts its head, the leaf above its eyes tilting toward you.

You can choose Chikorita or meet the other Pokémon first.

*choice
#Choose Chikorita -> choose_chikorita
#Keep looking -> starters

*passage choose_chikorita
*title A New Partner
*set starter_species "Chikorita"

Chikorita is your choice. Would you like to give your partner a nickname?

*choice
#Keep the species name -> join
#Give a nickname -> nickname

*passage examine_piplup
*title Meeting Piplup

Piplup stands upright and watches you, then takes a small step closer.

You can choose Piplup or meet the other Pokémon first.

*choice
#Choose Piplup -> choose_piplup
#Keep looking -> starters

*passage choose_piplup
*title A New Partner
*set starter_species "Piplup"

Piplup is your choice. Would you like to give your partner a nickname?

*choice
#Keep the species name -> join
#Give a nickname -> nickname

*passage nickname
*title A Name for Your Partner

What would you like to call ${starter_species}?

*input_text starter_nickname "Pokémon nickname" -> join

*passage join
*title Your Journey Begins
*checkpoint
*if starter_species == "Charmander"
  *add_pokemon starter_charmander starter_nickname
*elseif starter_species == "Chikorita"
  *add_pokemon starter_chikorita starter_nickname
*else
  *add_pokemon starter_piplup starter_nickname
*journal partnered "${trainer_name} partnered with ${starter_species}."

With ${starter_species} at your side, you leave the harbor ready to begin your journey in Aurelia.

Your Pokémon is listed in Party. This is the end of the current playable foundation.
