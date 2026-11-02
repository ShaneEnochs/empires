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

The ferry has been underway since dawn. Its engines hum beneath your feet, and the crowded passenger lounge smells of coffee, damp jackets, and the breakfast rolls someone has been selling at the counter. Every seat is taken. A few people have settled on the floor with their bags, trying to make room for everyone passing through.

Almost all of them are going where you are. Some have traveled halfway around the world to enter the inaugural Aurelian League; others have come from towns along the coast. You can tell the contestants by the registration notices on their phones, the nervous glances at the clock, and the way conversations keep returning to Pokémon.

The strangest thing is how few Pokémon there are. On an ordinary voyage, someone would have a partner asleep under their chair or perched on a shoulder. The League's rule against bringing Pokémon means even experienced trainers have come aboard alone. Your own journey will begin with a new partner in Lezano.

*page_break

A screen above the café counter plays the same advertisement for the third time. Eight golden Laurels appear beneath a sweeping view of Aurelia. A presenter promises challenges across the region, with three finalists competing for the title of Aurelian Champion. The advertisement ends before anyone explains what those challenges will actually involve.

"Still think they should've given us a proper list," someone says behind you. His friend tells him that discovering things is supposed to be the point. They start arguing about whether a person can win without ever battling, and the argument draws in two strangers before you can hear the end of it.

You move toward a window for a better look at the coast. A paper cup slides across the floor with the next turn of the ship. A young woman in an orange jacket catches it with her shoe, drops it in the bin, and notices you watching the approaching land. She comes over, smiling.

*continue name

*passage name
*title A Fellow Contestant

"First time in Aurelia?" she asks. "Me too. I've been on this boat for hours and I still can't decide whether I want it to hurry up or turn around so I can have another day to prepare." She shifts the strap of her bag higher onto her shoulder. A little Wingull charm dangles from its zipper.

"I'm Lucia, by the way. I was going to introduce myself to people when we got there, but I don't see the point in waiting. What should I call you? Just your first name is fine. We'll have enough official introductions once we're off this thing."

*input_text trainer_name "Your first name" -> pronouns

*passage pronouns
*title Getting Acquainted

"${trainer_name}," Lucia repeats, getting a feel for the name. She takes out her phone and starts a new contact, then stops with her thumb over the screen. "I should probably get this right, too. I use she and her. What about you?"

For all her easy confidence, she seems genuinely interested in your answer. Behind her, another announcement reminds contestants to have their registration documents ready when the ferry docks.

*choice
#He / Him -> he
#She / Her -> she
#They / Them -> they

*passage he
*title A Name to Remember
*set pronouns "He / Him"
*set pronouns_subject "he"
*set pronouns_object "him"
*set pronouns_possessive "his"
*set pronouns_possessive_pronoun "his"
*set pronouns_reflexive "himself"
*set use_plural_verbs false

Lucia finishes the contact and slips her phone away. "There. Now if we lose each other in that crowd, I'll know who I'm looking for. Provided I can get a signal, anyway."

She glances toward the land beyond the windows, then turns back to you. "So, ${trainer_name}, can I ask you something?"

*continue lucia_chat

*passage she
*title A Name to Remember
*set pronouns "She / Her"
*set pronouns_subject "she"
*set pronouns_object "her"
*set pronouns_possessive "her"
*set pronouns_possessive_pronoun "hers"
*set pronouns_reflexive "herself"
*set use_plural_verbs false

Lucia finishes the contact and slips her phone away. "There. Now if we lose each other in that crowd, I'll know who I'm looking for. Provided I can get a signal, anyway."

She glances toward the land beyond the windows, then turns back to you. "So, ${trainer_name}, can I ask you something?"

*continue lucia_chat

*passage they
*title A Name to Remember
*set pronouns "They / Them"
*set pronouns_subject "they"
*set pronouns_object "them"
*set pronouns_possessive "their"
*set pronouns_possessive_pronoun "theirs"
*set pronouns_reflexive "themself"
*set use_plural_verbs true

Lucia finishes the contact and slips her phone away. "There. Now if we lose each other in that crowd, I'll know who I'm looking for. Provided I can get a signal, anyway."

She glances toward the land beyond the windows, then turns back to you. "So, ${trainer_name}, can I ask you something?"

*continue lucia_chat

*passage lucia_chat
*title No Pokémon Allowed
*journal met_lucia "You met Lucia on the ferry to Lezano. She is excited about exploring Aurelia and meeting Pokémon."

"Isn't it strange being here without a Pokémon?" Lucia asks. "The rules make sense, I suppose. Everyone has to start with a new partner. But I keep looking down to check whether I've left someone behind." She laughs at herself and nudges her empty coat pocket.

She tells you about a family Floatzel who used to follow her along the shore near home. She isn't a veteran trainer, although she's spent enough time helping care for other people's Pokémon to know that liking them and understanding them are different things. The thought of meeting her own partner in Lezano has kept her awake for most of the trip.

A group of contestants passes the window, talking loudly about their future rankings. Lucia watches them go. "I've been thinking about this for months, and somehow I still don't know what I'll be good at. What about you? Actually, never mind. You've barely had a chance to sit down. You can ask me something instead."

*choice
#Ask what made her enter the League -> lucia_wildlife
#Ask what she knows about the Laurels -> lucia_rules
#Ask whether she is nervous about starting over -> lucia_nerves
#Wish her luck and look around the ferry -> open_deck

*passage lucia_wildlife
*title Places Worth Seeing
*set lucia_topic "wildlife"

"Mostly the chance to travel," Lucia admits. "Not just to the places people take photographs of. I want to see the wetlands and the little fishing towns and the places you can't reach from a tour bus. I've helped with Pokémon care back home, but there are so many things I've only ever read about."

She rests a hand on the window frame. "My parents think I should have picked a competition with a proper schedule. They might be right. But if I wait until I know exactly what I'm doing, I'll probably never leave."

A chime sounds from the speakers. Lucia glances toward the deck doors. "Come on. We're getting close enough to see the harbor now."

*continue open_deck

*passage lucia_rules
*title Eight Laurels
*set lucia_topic "rules"

"I've read the entrant guide twice," Lucia says. "You need eight Laurels before the season ends, but getting them doesn't automatically make you a finalist. Only the three highest-ranked people with all eight get to compete in the Triumvirate. So they're looking at how you handle the challenges, not only whether you finish them."

She lowers her voice a little. "They keep saying you don't have to battle to succeed. I like that. I just wish the guide had more examples of what you're supposed to do. It says 'show judgment' and 'work with Pokémon.' All right, but how does somebody score either of those?"

A chime sounds from the speakers. Lucia glances toward the deck doors. "Come on. We're getting close enough to see the harbor now."

*continue open_deck

*passage lucia_nerves
*title Second Thoughts
*set lucia_topic "nerves"

Lucia looks relieved that you've asked. "A little. More than a little when I think about the cameras. My family is going to watch every episode, which means they'll see every stupid thing I say for the next several months. I wish I hadn't promised my brother I'd wave whenever I saw a camera."

She smiles, though there's some tension in it. "I'm worried about meeting my partner, too. What if it doesn't like me? Everyone makes that part sound easy, and I know it isn't always. I suppose I'll find out when I get there."

A chime sounds from the speakers. Lucia glances toward the deck doors. "Come on. We're getting close enough to see the harbor now."

*continue open_deck

*passage open_deck
*title Time Before Docking

Lucia spots someone she recognizes from the boarding queue and excuses herself, promising to see you in Lezano. Before she disappears into the crowd, she points out the stairs to the upper deck. "Best view's up there. Don't miss it."

You still have a little time before docking. Near the lounge's timetable screen, a well-dressed young man is comparing the League guide on his phone with notes in a small notebook. A woman beside him keeps pointing out things he's overlooked. You could introduce yourself, or stay close enough to hear what they're saying without joining in. Beyond the doors, the open deck offers a quieter place to watch the coast.

*choice
#Go over and speak to the two contestants -> group_join
#Stay nearby and listen to their conversation -> eavesdrop
#Head outside for some peace and quiet -> rail

*passage group_join
*title Two More Contestants
*set ferry_encounter "conversation"
*journal met_dario "You introduced yourself to Dario, a serious contestant who pays close attention to League rankings."
*journal met_ilaria "You met Ilaria, who has questions about how the League judges its contestants."

The young man looks up when you approach. "Another contestant? Good. I'm Dario, and this is Ilaria. We were trying to work out whether the ranking system rewards finishing early or doing more with each Laurel. The guide is annoyingly vague about it." He makes room beside the timetable without waiting for you to ask.

Ilaria closes her notebook. "It tells you which qualities they value, but it doesn't say how they're measured. Dario thinks we should concentrate on making a strong impression. I think we'd be better off finding out what the judges actually look for." Her tone is mild, although Dario gives her a long-suffering look.

"Those aren't mutually exclusive," he replies. "And I do intend to win, if you're wondering. There's no point pretending otherwise. But I'd rather have to earn it than be handed something for showing up." He gives you an appraising glance, then offers his hand. Neither of them seems particularly interested in telling you what kind of contestant you ought to be.

The engines change pitch before the conversation can go much further. Ilaria tucks away her notebook and Dario checks the time. You exchange a few last words as the three of you join the movement toward the windows.

*continue dock_approach

*passage eavesdrop
*title Within Earshot
*set ferry_encounter "eavesdrop"
*journal heard_ranking_doubt "You overheard two contestants debating the League's unclear ranking criteria."

You stop near the timetable and pretend to read the arrivals board. The young man is speaking quietly, though not quite quietly enough. "Eight Laurels gets you into consideration, Ilaria. The final three are picked by ranking. There must be a proper way of comparing results. They wouldn't put a competition on television without one."

"Putting it on television is exactly why I'd like to know," the woman answers. "They're judging things such as courage and compassion. Fine. I just want to understand who decides what those mean. If two people help the same Pokémon in different ways, how are they supposed to compare them?"

The young man, Dario, argues that the judges have probably worked through all of that already. Ilaria doesn't seem convinced. Before you can hear more, a staff member announces that passengers should make their way toward the exits. The pair put their things away, still discussing the guide as they move toward the stairs.

*continue dock_approach

*passage rail
*title The Open Deck
*set ferry_encounter "quiet"

The wind is stronger outside. You find a place by the rail, away from the groups posing for photographs with the coast behind them. The air smells of salt and engine exhaust, and the ship's wake stretches back toward open water. From here you can see Lezano spread along the shore, its older stone buildings rising among glass-fronted offices and apartment blocks.

A Wingull follows the ferry for several minutes, occasionally crying out at the passengers who lean over the rail. One of them holds up a piece of bread, but a deckhand asks him to put it away. "They're perfectly capable of feeding themselves," she says. The Wingull circles once more and heads toward the harbor.

For a while you stay where you are, watching fishing boats move between the breakwaters. The crowd behind you still talks about winning, rankings, and the Pokémon they'll choose. Out here, you can almost forget there will be cameras waiting on the other side of the water.

*continue dock_approach

*passage dock_approach
*title The Harbor Ahead

The ferry slows as it passes between the breakwaters. Fishing boats rock gently beside the stone quays, and a pair of cranes stand above stacks of shipping containers. Farther inland, pale arches and colonnades line the streets climbing away from the waterfront. Red-and-gold banners hang from the terminal building.

*show_if ferry_encounter == "conversation"
Dario notices you near the stairs and raises a hand. Ilaria gives you a smaller wave before the crowd carries them toward a different exit.

*show_if ferry_encounter == "eavesdrop"
You see Dario and Ilaria again as they join the queue. Ilaria has the entrant guide open on her phone, and Dario is still trying to make his point. Neither seems aware that you overheard them.

*show_if ferry_encounter == "quiet"
The Wingull from the outer deck passes overhead, then disappears among the fishing boats. You've seen more of the city from the rail than you could have managed from the lounge.

Lucia catches sight of you in the line and squeezes through a gap between two families. "There you are, ${trainer_name}. Look at all those people." She nods toward the windows, where spectators are gathering behind temporary barriers. A camera crew is already filming the ferry, though the passengers are still waiting for permission to disembark.

The deck trembles as the ferry settles against its berth. Crew members secure the gangway, and a bell sounds above the doors. After hours of talking about the journey ahead, there's nothing left to do but step ashore.

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
