*var trainer_name "Unknown"
*var pronouns "They / Them"
*var pronouns_subject "they"
*var pronouns_object "them"
*var pronouns_possessive "their"
*var pronouns_possessive_pronoun "theirs"
*var pronouns_reflexive "themself"
*var use_plural_verbs true
*var lucia_contact false
*var lucia_topic "none"
*var ferry_encounter "none"
*stat trainer_name "Trainer name"
*stat pronouns "Pronouns"

*chapter The Crossing

*passage ferry
*title Approaching Lezano

The ferry has been underway since very early this morning, and by now you've grown accustomed to the gentle vibration of its engines beneath your feet. Sunlight streams through the passenger lounge's wide windows, catching on the polished floors and the occasional glassware on the many tables. The air smells wonderfully of fresh coffee and warm breakfast rolls. Unfortunately, every seat in the lounge is occupied, and the little café near the stairs has a line stretching almost to the door. Even if you were to treat yourself to something delicious, you'd have nowhere comfortable to sit and enjoy it.

A few passengers have made themselves at home on the floor, sitting cross-legged beside their luggage or leaning against the walls with their breakfast balanced on their knees. Others have given up on finding seats altogether and gathered around the windows, hoping to catch their first glimpse of the Aurelian coastline. Despite the crowd, the atmosphere is cheerful. Conversations overlap with the occasional burst of laughter, and you hear a group of trainers having a spirited discussion about which starter Pokémon they hope to receive.

There's still a little time before the ferry reaches Lezano. You could take another look at the café, or find a quieter place by the windows.

*choice
#See what's happening at the café -> ferry_cafe
#Find a place by the windows -> ferry_windows

*passage ferry_cafe
*title The Breakfast Crowd
*journal saw_minccino_cafe "You saw Minccino clearing tables in the ferry café."
*journal saw_machoke_cafe "You saw Machoke moving luggage through the café crowd."

The café queue has barely moved since you last checked. A Minccino in a tiny navy apron is helping the staff clear tables, gathering used napkins into a basket and polishing each empty spot with its tail. A crew member sets a fresh tray of rolls on the counter while Minccino tries, without much success, to convince a man to lift his elbows so it can wipe beneath them. The man eventually obliges, earning an approving chirp.

You consider joining the queue, but a Machoke wearing a crew vest comes through the nearby doors with a trolley full of luggage. The people waiting for coffee shuffle aside to let it pass. You follow the cleared path toward the windows instead, deciding breakfast can wait until you're on land.

*continue ferry_context

*passage ferry_windows
*title A Better View
*journal saw_wingull_windows "You saw Wingull following the ferry’s wake."
*journal saw_machoke_windows "You saw Machoke helping the baggage team."
*journal saw_minccino_windows "You saw Minccino collecting napkins near the windows."

The crowd thins near the far end of the lounge. Through the glass, the sea is bright in the morning sun, and several Wingull are following the ferry's wake. A Machoke in a blue crew vest is helping the baggage team move suitcases away from the doors. When a trolley catches on the edge of a floor mat, Machoke lifts its front wheels clear while a deckhand straightens the mat.

Behind you, a Minccino wearing a café apron darts between tables to collect discarded napkins. You step out of its way and claim a little space by the window, where you can finally see the coastline without looking over somebody's shoulder.

*continue ferry_context

*passage ferry_context
*title One of the Hundred

Everyone aboard is bound for the inaugural Aurelian League. The passengers are contestants, members of the press, or people working aboard the ferry and for the event. Some have traveled halfway around the world for the opportunity. Only one hundred contestants were accepted, and somehow, you're one of them. The whole thing has been so wonderfully unexpected that part of you wonders whether there might have been a mistake.

After all, you only received your Pokémon Trainer license last week.

Yet here you are, with your luggage packed and your future waiting somewhere on the other side of the water. By the end of today, you'll finally have a Pokémon partner of your very own. The League doesn't allow contestants to bring Pokémon with them, so nobody here will be arriving with an experienced team. The crew's working Pokémon are a welcome exception.

*continue ferry_ad

*passage ferry_ad
*title A Glimpse of the League

The television mounted above the café counter is playing the same advertisement for what must be the eighth time since you boarded. A cheerful little tune accompanies a sweeping aerial view of Aurelia, beginning with its sunlit coastline before moving inland over green hills, forests, and towns. Eight golden Laurels appear one after another across the screen, accompanied by the presenter's familiar voice.

"One hundred contestants. Eight Laurels. Three Finalists. One Champion!" she announces enthusiastically, before promising viewers a season of adventures, challenges, and discoveries. The advertisement ends with a glimpse of the Grand Amphitheater, where the three highest-ranked contestants will compete for the title of Aurelian Champion.

Two young men standing beside a stack of luggage are having a disagreement. "I'm serious. How are we supposed to prepare for eight challenges when nobody will tell us what they are? What if one involves swimming? I can't swim!" His friend laughs and reminds him that discovering things is supposed to be part of the adventure, which only irritates him further.

Before long, their discussion turns to whether someone could become Champion without winning a single Pokémon battle. A contestant in line for coffee insists that battling is probably the easiest way to earn points, while a reporter with a press badge asks them to elaborate. The argument seems likely to last all the way to shore.

*page_break

You make your way toward the windows, stepping around bags and apologizing to a man whose newspaper you've nearly knocked out of his hands. Outside, the coastline is finally coming into view. You can make out the pale buildings of Lezano clustered around its harbor, with green hills rising behind them. A few Wingull circle overhead, dipping toward the water before climbing back into the breeze. You've seen photographs of the city, of course, but they're hardly the same as seeing it in person.

The ferry makes a gentle turn, causing a paper cup to roll across the floor and bump against someone's shoe. Its owner, a young woman wearing a bright orange jacket, catches it before it can travel any farther. She bends to retrieve it, deposits it in a nearby bin, and brushes a loose strand of brown hair away from her face. When she notices you standing by the window, she follows your gaze toward the coast and comes over.

"Pretty exciting, isn't it?" she says. "I was going to head up to the observation deck, but half the ferry seems to have had the same idea. We can see the harbor perfectly well from here." A small silver Lapras pendant rests against her shirt. She leans closer to the window, then looks toward the café. "I've already eaten everything I brought, and I made the mistake of checking the prices of the breakfast rolls."

She smiles at you. "Sorry, I should introduce myself. I'm Lucia. You're one of the contestants, right?"

*continue name

*passage name
*title A Fellow Contestant
*journal saw_wingull_approach "You saw Wingull circling on the approach to Lezano."

Lucia looks pleased when you confirm it. "I tried introducing myself to someone upstairs earlier, but he turned out to be a journalist. As soon as he found out I was entering the League, he started asking me all sorts of questions. What did I think of my chances? Who did I consider my biggest competition? Did I have a strategy?"

She adjusts the strap of her bag. "He kept asking another question before I'd even finished answering the last one. I got so overwhelmed that I finally made an excuse and left." She glances toward the stairs. "Now I'm worried about what he's going to write. I probably sounded completely clueless, which I suppose I am. But aren't we all at this point?"

She offers you her hand. "There are a hundred of us, and I don't want to wait until the first challenge to start making friends. What should I call you?"

*input_text trainer_name "Your first name" -> contact_question

*passage contact_question
*title A Familiar Face

"Hi, ${trainer_name}!" Lucia says, giving your hand a warm shake. She glances toward the growing crowd around the windows, then takes out her phone. "Would it be okay if I added you to my contacts? It would be nice to have someone I know when we get to Lezano."

*choice
#Exchange numbers with Lucia -> contact_yes
#Politely decline -> contact_no

*passage contact_yes
*title Keeping in Touch
*set lucia_contact true

You exchange numbers. Lucia saves your contact, then slips her phone back into her jacket pocket. "Good. If one of us ends up lost at registration, at least we'll have someone to ask for directions."

*continue pronouns

*passage contact_no
*title Another Time

You'd rather not exchange numbers just yet. "No problem," Lucia says, putting her phone away. "We might run into each other at registration anyway."

*continue pronouns

*passage pronouns
*title Getting Acquainted

Lucia shifts her bag onto her other shoulder. "Oh, before I forget, I use she and her. What pronouns do you use?"

*choice
#He / Him -> he
#She / Her -> she
#They / Them -> they

*passage he
*title Getting Acquainted
*set pronouns "He / Him"
*set pronouns_subject "he"
*set pronouns_object "him"
*set pronouns_possessive "his"
*set pronouns_possessive_pronoun "his"
*set pronouns_reflexive "himself"
*set use_plural_verbs false

"Got it," Lucia says. A crew member asks everyone to clear the aisle for another luggage trolley, and you both move closer to the window.

*continue lucia_chat

*passage she
*title Getting Acquainted
*set pronouns "She / Her"
*set pronouns_subject "she"
*set pronouns_object "her"
*set pronouns_possessive "her"
*set pronouns_possessive_pronoun "hers"
*set pronouns_reflexive "herself"
*set use_plural_verbs false

"Got it," Lucia says. A crew member asks everyone to clear the aisle for another luggage trolley, and you both move closer to the window.

*continue lucia_chat

*passage they
*title Getting Acquainted
*set pronouns "They / Them"
*set pronouns_subject "they"
*set pronouns_object "them"
*set pronouns_possessive "their"
*set pronouns_possessive_pronoun "theirs"
*set pronouns_reflexive "themself"
*set use_plural_verbs true

"Got it," Lucia says. A crew member asks everyone to clear the aisle for another luggage trolley, and you both move closer to the window.

*continue lucia_chat

*passage lucia_chat
*title An Unusual Beginning
*journal met_lucia "You met Lucia aboard the ferry to Lezano. She's looking forward to traveling across Aurelia and meeting Pokémon."

"Have you noticed how strange it is to see Pokémon working on the ferry when none of us are allowed to bring our own?" Lucia asks. "I know why the League wants a fresh start, but it's going to take some getting used to. At home, our Floatzel follows me everywhere. He even waits outside the market when I go shopping."

She tells you how he once dragged her brother's boots into a rock pool because he thought somebody had left them too close to the tide. She's spent years helping her family care for him, but she's never raised a Pokémon herself. "I know how he likes his dinner and when he wants to be left alone. With a new partner, I'll have to learn all of that again." She touches her Lapras pendant. "I hope my starter likes me."

The harbor is getting closer, and Lucia takes one more look at it before turning back to you. "I've been doing all the talking. Is there something you wanted to ask me?"

*choice
#Ask why she decided to enter the League -> lucia_wildlife
#Ask what she knows about the Laurels -> lucia_rules
#Say you'd like to look around before docking -> open_deck

*passage lucia_wildlife
*title Places Worth Visiting
*set lucia_topic "wildlife"

"I want to see the Pokémon," Lucia says. "Not only the ones that live near towns. There are wetlands in the north, old forests, and islands where you have to take a boat to get anywhere. If the League gives me a reason to travel through places like that, I'll be happy."

She touches the Lapras pendant at her throat. "My little brother gave me this before I left. He wants pictures of every Water-type I see, especially a Lapras. I told him there was a good chance I'd come home with a hundred photographs of Magikarp instead." She smiles. "I'm planning to send them anyway."

*continue open_deck

*passage lucia_rules
*title Eight Laurels
*set lucia_topic "rules"

Lucia opens the entrant guide on her phone. "It says we have to earn eight Laurels. Not just for battles, either. They're looking for things like courage, compassion, and good judgment. But only the three highest-ranked contestants with all eight Laurels get to the Triumvirate."

She scrolls down. "I can understand judging a battle. What I don't understand is how they'll compare everything else. Suppose two people help the same frightened Pokémon, but in completely different ways. Who decides which one did better?" She locks the screen. "I hope they explain that when we arrive."

*continue open_deck

*passage open_deck
*title A Little Time to Spare

Lucia notices the time and heads off to collect the rest of her luggage, promising to look for you at the terminal. You watch her disappear into the crowd before considering what to do with the few minutes you have left.

A neatly dressed young man near the timetable is comparing notes with a woman holding the League guide. You could introduce yourself, or stay nearby and listen. There's also the observation deck, if you'd rather take one last look at the coast before docking.

*choice
#Introduce yourself to the two contestants -> group_join
#Stay nearby and listen without interrupting -> eavesdrop
#Go up to the observation deck instead -> rail

*passage group_join
*title Dario and Ilaria
*set ferry_encounter "conversation"
*journal met_dario "You introduced yourself to Dario, a contestant interested in the League's rankings."
*journal met_ilaria "You met Ilaria, a contestant curious about how the League will judge its challenges."

"I'm Dario," the young man says, moving his notebook so you can see it. "This is Ilaria. Tell me if you can make sense of the rankings. Eight Laurels gets you qualified, but the guide doesn't say how they choose the top three."

"It says they consider your performance," Ilaria replies, "but it doesn't explain what counts as good performance when the challenges aren't all battles." She points to a passage in the guide about compassion. "If someone helps a Pokémon without making a spectacle of it, will anyone even know?"

Dario takes a moment to consider that. "I still want to win," he says, "but I'd rather know what I'm being judged on." The ship's engines change pitch, and people begin gathering their luggage. You exchange farewells, agreeing you might see one another in Lezano.

*continue dock_approach

*passage eavesdrop
*title Within Earshot
*set ferry_encounter "eavesdrop"
*journal heard_ranking_doubt "You overheard Dario and Ilaria questioning how the League's rankings will be decided."

You pause beside the timetable, close enough to hear the two contestants without interrupting. "Eight Laurels, then a ranking," the young man says, tapping his notebook. "There has to be a way to work out what's worth the most. We can't plan anything if we don't know."

"Maybe planning everything isn't the point, Dario," the woman replies. "Suppose you find a Pokémon that needs help, but stopping would put you behind the others. Does the League reward the person who stops? Or the person who gets to the next Laurel first?"

Dario doesn't answer immediately. When he finally starts to speak, an announcement asks everyone to collect their luggage. "I just don't like being surprised," he says, closing his notebook. The woman, Ilaria, gives him an amused look as they head toward the stairs.

*continue dock_approach

*passage rail
*title The Observation Deck
*journal saw_wingull_rail "You saw a Wingull land on the observation deck railing."
*set ferry_encounter "quiet"

The breeze outside is cooler than you expected. Most of the passengers have gathered along the forward rail, but you find a place farther along where you can watch the city come into view. Lezano's pale buildings rise behind the harbor, with green hills stretching inland.

A Wingull lands on the railing near a contestant holding a breakfast roll. The contestant breaks off a piece, but a deckhand asks him not to feed the wild Pokémon. He puts it away, and the Wingull gives an indignant cry before flying off toward a fishing boat.

You stay until the ferry sounds its arrival bell. Down on the working deck, the crew's Machoke is already guiding a cart of luggage toward the exit. You take one last look across the water, then head inside to collect your own bag.

*continue dock_approach

*passage dock_approach
*title Lezano Harbor

The ferry passes between the breakwaters and slows beside the quays. Fishing boats rock in their berths, and red-and-gold League banners hang from the terminal. Above the crowd waiting on shore, a digital sign welcomes the contestants. Several camera operators are filming the ferry as it approaches.

*show_if ferry_encounter == "conversation"
Dario spots you near the stairs and waves. Ilaria lifts a hand from where she's standing beside him, then turns to make sure her notebook is safely tucked into her bag.

*show_if ferry_encounter == "eavesdrop"
Dario and Ilaria stand a few places ahead of you, still talking quietly. They haven't noticed that you heard their earlier conversation.

*show_if ferry_encounter == "quiet"
Through the window, you spot the same Wingull circling above a fishing boat. It has finally found somewhere more promising than the observation deck.

*show_if lucia_topic == "wildlife"
Lucia appears with her bag and points out two Wingull perched on the harbor wall. She's already trying to photograph them through the glass.

*show_if lucia_topic == "rules"
Lucia rejoins the queue just long enough to tell you that the volunteers are handing out schedules for a briefing. "Maybe we'll finally get some answers," she says.

*show_if lucia_topic == "none"
Lucia spots you across the lounge and gives you a quick wave before turning to retrieve her bag.

A low thump runs through the deck as the ferry settles against its berth. The engines fall quiet. The crew begins securing the lines, and the passengers gather near the doors with their luggage. You're still aboard when the gangway begins to lower, with Lezano waiting just beyond the glass.
