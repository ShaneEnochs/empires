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
*var rival_response "none"
*var credits 0
*item league_badge "Aurelian League contestant badge"
*item city_map "Map of Lezano"
*item hotel_assignment "Hotel room assignment"
*stat trainer_name "Trainer name"
*stat pronouns "Pronouns"
*stat credits "Credits"

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
*journal met_lucia "You met Lucia, a fellow League contestant, aboard the ferry to Lezano."
*journal lucia_journalist "Lucia was overwhelmed by a journalist's rapid questions and worries about his article."

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
*journal lucia_contact_shared "You exchanged phone numbers with Lucia."

You exchange numbers. Lucia saves your contact, then slips her phone back into her jacket pocket. "Good. If one of us ends up lost at registration, at least we'll have someone to ask for directions."

*continue pronouns

*passage contact_no
*title Another Time

You'd rather not exchange numbers just yet. "No problem," Lucia says, putting her phone away. "We might run into each other at registration anyway."

*continue pronouns

*passage pronouns
*title Getting Acquainted
*journal lucia_pronouns "Lucia uses she/her pronouns."

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
*journal lucia_family "Lucia talked about her family's Floatzel and her hopes for her first Pokémon partner."

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
*journal lucia_travel "Lucia wants to explore wild Pokémon habitats across Aurelia and send photos to her brother."

"I want to see the Pokémon," Lucia says. "Not only the ones that live near towns. There are wetlands in the north, old forests, and islands where you have to take a boat to get anywhere. If the League gives me a reason to travel through places like that, I'll be happy."

She touches the Lapras pendant at her throat. "My little brother gave me this before I left. He wants pictures of every Water-type I see, especially a Lapras. I told him there was a good chance I'd come home with a hundred photographs of Magikarp instead." She smiles. "I'm planning to send them anyway."

*continue open_deck

*passage lucia_rules
*title Eight Laurels
*set lucia_topic "rules"
*journal lucia_ranking_questions "Lucia wonders how the League judges acts of compassion and other non-battle challenges."

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
*journal saw_champ "A contestant with CHAMP embroidered on his jacket shoved past you on the ferry's gangway."

The ferry settles against the quay with a gentle bump, and the last of the engine's vibrations fades beneath your feet. Outside, Lezano is considerably larger than it appeared from the water. Rows of cream and terracotta buildings climb the hills beyond the harbor, their balconies crowded with flowers and laundry drying in the morning sun. Narrow streets wind between them, occasionally opening into little squares where cafés have arranged tables beneath colorful awnings. Farther uphill, the white columns of an enormous building rise above the rooftops.

The harbor is bustling with activity. Fishing boats are unloading their morning catches, dockworkers are moving crates between warehouses, and several Machoke are helping the ferry crew transfer luggage onto waiting carts. Red-and-gold banners hang from windows, lampposts, and balconies. A crowd has gathered along the waterfront to welcome the contestants, and a few reporters have already found people willing to give interviews.

When the crew opens the doors, you join the procession making its way down the gangway. The fresh sea air is a relief after the crowded lounge, and you slow a little to take in the city. You're halfway to shore when someone pushes past you, knocking your shoulder hard enough that you have to catch yourself against the railing. The young man has dark hair and a green jacket with **CHAMP** embroidered across the back in large gold letters. "Could you walk any slower?" he snaps, glancing over his shoulder. "Some of us would actually like to get off this boat today, you know."

*choice
#Confront him about his rudeness -> lezano_arrival [set rival_response "confront"]
#Ignore him and keep walking -> lezano_arrival [set rival_response "ignore"]

*chapter Lezano

*passage lezano_arrival
*title The Waterfront

*show_if rival_response == "confront"
"Kinda rude there, 'champ'," you say, making sure to emphasize the last word in the most mocking way possible. "Getting to shore a few seconds sooner isn't going to really matter now, is it?"

*show_if rival_response == "confront"
He stops and gives you an irritated look. For a moment, you think he might actually argue with you, but then he glances toward the dock and shakes his head. "Whatever. Not worth my time." Before you can respond, he's already making his way down the remaining stretch of gangway, squeezing past another contestant as he goes.

*show_if rival_response == "ignore"
You decide he isn't worth the trouble and continue walking. The young man doesn't wait for an answer anyway. He's already pushing his way around the next passenger, earning an angry complaint from an older man who nearly drops his tripod and bag in the process. A deckhand calls for him to slow down, but he seems determined to get off the ferry ahead of everyone else.

Once your feet are finally on solid ground, you take a moment to get your bearings. The waterfront is even livelier up close. A street musician is playing an accordion nearby, and the cheerful music carries over the conversations and occasional cries of Wingull circling above the fishing boats. Between the harbor and the streets beyond, several vendors have already set up their stalls, apparently hoping to take advantage of the sudden influx of visitors.

A little farther along the wharf, a row of temporary booths stands beneath red-and-gold awnings bearing the Aurelian League emblem. Large signs reading **CONTESTANT CHECK-IN** direct the arriving trainers toward them. Volunteers are checking names against tablets and handing out welcome packets. The line moves surprisingly quickly, and before long, you reach the front.

*continue lezano_checkin

*passage lezano_checkin
*title Contestant Check-In
*set credits 100
*add_item league_badge 1
*add_item city_map 1
*add_item hotel_assignment 1
*journal league_registered "You checked in at Lezano, received your League badge and city map, and learned that orientation is at four o'clock."

"Welcome to Lezano!" says a friendly-looking woman in a red League polo shirt. "Could I have your name, please?" You give her your name, and she finds your entry on her tablet.

After checking your information, she retrieves a packet from beneath the counter and passes it to you. Inside are your contestant identification badge, a hotel room assignment, and a surprisingly detailed map of the city. Several important locations have been highlighted, including the Pokémon Center, the waterfront markets, the League reception center, and a large public square labeled the Lezano Civic Forum.

"Your orientation is at four o'clock this afternoon, at the Civic Forum," she explains, pointing out the square on your map. "It's just up the hill from the harbor, and there'll be signs along the way, so you shouldn't have any trouble finding it. Until then, you're free to explore the city, get something to eat, or settle into your hotel room. Your accommodations have already been arranged, and all of your luggage will be delivered directly to your room, so you won't have to worry about carrying anything around."

"That's wonderful, thank you," you say, smiling at the nice lady.

She taps your identification badge. "This also serves as your debit card. The League has already loaded it with a starting balance of 100 credits, which should help you get settled in. All the shops here accept credits exclusively, so you won't be able to use any other currency while you're in Lezano. There's lots of ways to make credits, which they'll go over during orientation. Make sure you keep your badge on you at all times!"

She indicates the location of your hotel on the map and wishes you luck before turning to greet the next contestant. You step aside to let the line continue moving. You have several hours before orientation, and for the first time since leaving home, there's no particular reason to hurry. Your hotel isn't far, and after a morning aboard the ferry, a little time to yourself sounds appealing. On the other hand, you haven't had a proper meal since breakfast, and the smells drifting from the waterfront restaurants are increasingly difficult to ignore.

*choice
#Head to the hotel and check out your room -> hotel_route
#Find somewhere nice to eat -> food_route

*passage hotel_route
*title Toward the Hotel

You fold the map and turn toward the streets leading to your hotel.

*passage food_route
*title Something to Eat

You follow the smell of cooking toward the waterfront cafés.
