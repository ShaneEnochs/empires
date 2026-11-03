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
*var hotel_response "none"
*var restaurant_response "none"
*var dex_installed false
*var hotel_clue "none"
*var hotel_followup "none"
*var victra_case "none"
*var restaurant_followup "none"
*var livia_impression "none"
*item league_badge "Aurelian League contestant badge"
*item city_map "Map of Lezano"
*item hotel_assignment "Hotel room assignment"
*stat trainer_name "Trainer name"
*stat pronouns "Pronouns"
*stat credits "Credits"

*chapter Chapter 1: The Crossing

*passage ferry
*title Approaching Lezano Aboard the Portia

The ferry has been underway since very early this morning, and by now you've grown accustomed to the gentle vibration of its engines beneath your feet. Sunlight streams through the passenger lounge's wide windows, catching on the polished floors and the occasional glassware on the many tables. The air smells wonderfully of fresh coffee and warm breakfast rolls. Unfortunately, every seat in the lounge is occupied, and the little café near the stairs has a line stretching almost to the door. Even if you were to treat yourself to something delicious, you'd have nowhere comfortable to sit and enjoy it.

A few passengers have made themselves at home on the floor, sitting cross-legged beside their luggage or leaning against the walls with their breakfast balanced on their knees. Others have given up on finding seats altogether and gathered around the windows, hoping to catch their first glimpse of the Aurelian coastline. Despite the crowd, the atmosphere is cheerful. Conversations overlap with the occasional burst of laughter, and you hear a group of trainers having a spirited discussion about which starter Pokémon they hope to receive.

There's still a little time before the ferry reaches Lezano. You could take another look at the café, or find a quieter place by the windows.

*choice
#See what's happening at the café -> ferry_cafe
#Find a place by the windows -> ferry_windows

*passage ferry_cafe
*title The Breakfast Crowd
*hide_title
*journal saw_minccino_cafe "You saw Minccino clearing tables in the ferry café."
*journal saw_machoke_cafe "You saw Machoke moving luggage through the café crowd."

The café queue has barely moved since you last checked. A Minccino in a tiny navy apron is helping the staff clear tables, gathering used napkins into a basket and polishing each empty spot with its tail. A crew member sets a fresh tray of rolls on the counter while Minccino tries, without much success, to convince a man to lift his elbows so it can wipe beneath them. The man eventually obliges, earning an approving chirp.

You consider joining the queue, but a Machoke wearing a crew vest comes through the nearby doors with a trolley full of luggage. The people waiting for coffee shuffle aside to let it pass. You follow the cleared path toward the windows instead, deciding breakfast can wait until you're on land.

*continue ferry_context

*passage ferry_windows
*title A Better View
*hide_title
*journal saw_wingull_windows "You saw Wingull following the ferry’s wake."
*journal saw_machoke_windows "You saw Machoke helping the baggage team."
*journal saw_minccino_windows "You saw Minccino collecting napkins near the windows."

The crowd thins near the far end of the lounge. Through the glass, the sea is bright in the morning sun, and several Wingull are following the ferry's wake. A Machoke in a blue crew vest is helping the baggage team move suitcases away from the doors. When a trolley catches on the edge of a floor mat, Machoke lifts its front wheels clear while a deckhand straightens the mat.

Behind you, a Minccino wearing a café apron darts between tables to collect discarded napkins. You step out of its way and claim a little space by the window, where you can finally see the coastline without looking over somebody's shoulder.

*continue ferry_context

*passage ferry_context
*title One of the Hundred
*hide_title

Everyone aboard is bound for the inaugural Aurelian League. The passengers are contestants, members of the press, or people working aboard the ferry and for the event. Some have traveled halfway around the world for the opportunity. Only one hundred contestants were accepted, and somehow, you're one of them. The whole thing has been so wonderfully unexpected that part of you wonders whether there might have been a mistake.

After all, you only received your Pokémon Trainer license last week.

Yet here you are, with your luggage packed and your future waiting somewhere on the other side of the water. By the end of today, you'll finally have a Pokémon partner of your very own. The League doesn't allow contestants to bring Pokémon with them, so nobody here will be arriving with an experienced team. The crew's working Pokémon are a welcome exception.

*continue ferry_ad

*passage ferry_ad
*title A Glimpse of the League
*hide_title

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
*hide_title
*journal saw_wingull_approach "You saw Wingull circling on the approach to Lezano."
*journal met_lucia "You met Lucia, a fellow League contestant, aboard the ferry to Lezano."
*journal lucia_journalist "Lucia was overwhelmed by a journalist's rapid questions and worries about his article."

Lucia looks pleased when you confirm it. "I tried introducing myself to someone upstairs earlier, but he turned out to be a journalist. As soon as he found out I was entering the League, he started asking me all sorts of questions. What did I think of my chances? Who did I consider my biggest competition? Did I have a strategy?"

She adjusts the strap of her bag. "He kept asking another question before I'd even finished answering the last one. I got so overwhelmed that I finally made an excuse and left." She glances toward the stairs. "Now I'm worried about what he's going to write. I probably sounded completely clueless, which I suppose I am. But aren't we all at this point?"

She offers you her hand. "There are a hundred of us, and I don't want to wait until the first challenge to start making friends. What should I call you?"

*input_text trainer_name "Your first name" -> contact_question

*passage contact_question
*title A Familiar Face
*hide_title

"Hi, ${trainer_name}!" Lucia says, giving your hand a warm shake. She glances toward the growing crowd around the windows, then takes out her phone. "Would it be okay if I added you to my contacts? It would be nice to have someone I know when we get to Lezano."

*choice
#Exchange numbers with Lucia -> contact_yes
#Politely decline -> contact_no

*passage contact_yes
*title Keeping in Touch
*hide_title
*set lucia_contact true
*journal lucia_contact_shared "You exchanged phone numbers with Lucia."

You exchange numbers. Lucia saves your contact, then slips her phone back into her jacket pocket. "Good. If one of us ends up lost at registration, at least we'll have someone to ask for directions."

*continue pronouns

*passage contact_no
*title Another Time
*hide_title

You'd rather not exchange numbers just yet. "No problem," Lucia says, putting her phone away. "We might run into each other at registration anyway."

*continue pronouns

*passage pronouns
*title Getting Acquainted
*hide_title
*journal lucia_pronouns "Lucia uses she/her pronouns."

Lucia shifts her bag onto her other shoulder. "Oh, before I forget, I use she and her. What pronouns do you use?"

*choice
#He / Him -> he
#She / Her -> she
#They / Them -> they

*passage he
*title Getting Acquainted
*hide_title
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
*hide_title
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
*hide_title
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
*hide_title
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
*hide_title
*set lucia_topic "wildlife"
*journal lucia_travel "Lucia wants to explore wild Pokémon habitats across Aurelia and send photos to her brother."

"I want to see the Pokémon," Lucia says. "Not only the ones that live near towns. There are wetlands in the north, old forests, and islands where you have to take a boat to get anywhere. If the League gives me a reason to travel through places like that, I'll be happy."

She touches the Lapras pendant at her throat. "My little brother gave me this before I left. He wants pictures of every Water-type I see, especially a Lapras. I told him there was a good chance I'd come home with a hundred photographs of Magikarp instead." She smiles. "I'm planning to send them anyway."

*continue open_deck

*passage lucia_rules
*title Eight Laurels
*hide_title
*set lucia_topic "rules"
*journal lucia_ranking_questions "Lucia wonders how the League judges acts of compassion and other non-battle challenges."

Lucia opens the entrant guide on her phone. "It says we have to earn eight Laurels. Not just for battles, either. They're looking for things like courage, compassion, and good judgment. But only the three highest-ranked contestants with all eight Laurels get to the Triumvirate."

She scrolls down. "I can understand judging a battle. What I don't understand is how they'll compare everything else. Suppose two people help the same frightened Pokémon, but in completely different ways. Who decides which one did better?" She locks the screen. "I hope they explain that when we arrive."

*continue open_deck

*passage open_deck
*title A Little Time to Spare
*hide_title

Lucia notices the time and heads off to collect the rest of her luggage, promising to look for you at the terminal. You watch her disappear into the crowd before considering what to do with the few minutes you have left.

A neatly dressed young man near the timetable is comparing notes with a woman holding the League guide. You could introduce yourself, or stay nearby and listen. There's also the observation deck, if you'd rather take one last look at the coast before docking.

*choice
#Introduce yourself to the two contestants -> group_join
#Stay nearby and listen without interrupting -> eavesdrop
#Go up to the observation deck instead -> rail

*passage group_join
*title Cassius and Octavia
*hide_title
*set ferry_encounter "conversation"
*journal met_cassius "You introduced yourself to Cassius, a contestant interested in the League's rankings."
*journal met_octavia "You met Octavia, a contestant curious about how the League will judge its challenges."

"I'm Cassius," the young man says, moving his notebook so you can see it. "This is Octavia. Tell me if you can make sense of the rankings. Eight Laurels gets you qualified, but the guide doesn't say how they choose the top three."

"It says they consider your performance," Octavia replies, "but it doesn't explain what counts as good performance when the challenges aren't all battles." She points to a passage in the guide about compassion. "If someone helps a Pokémon without making a spectacle of it, will anyone even know?"

Cassius takes a moment to consider that. "I still want to win," he says, "but I'd rather know what I'm being judged on." The ship's engines change pitch, and people begin gathering their luggage. You exchange farewells, agreeing you might see one another in Lezano.

*continue dock_approach

*passage eavesdrop
*title Within Earshot
*hide_title
*set ferry_encounter "eavesdrop"
*journal heard_ranking_doubt "You overheard Cassius and Octavia questioning how the League's rankings will be decided."

You pause beside the timetable, close enough to hear the two contestants without interrupting. "Eight Laurels, then a ranking," the young man says, tapping his notebook. "There has to be a way to work out what's worth the most. We can't plan anything if we don't know."

"Maybe planning everything isn't the point, Cassius," the woman replies. "Suppose you find a Pokémon that needs help, but stopping would put you behind the others. Does the League reward the person who stops? Or the person who gets to the next Laurel first?"

Cassius doesn't answer immediately. When he finally starts to speak, an announcement asks everyone to collect their luggage. "I just don't like being surprised," he says, closing his notebook. The woman, Octavia, gives him an amused look as they head toward the stairs.

*continue dock_approach

*passage rail
*title The Observation Deck
*hide_title
*journal saw_wingull_rail "You saw a Wingull land on the observation deck railing."
*set ferry_encounter "quiet"

The breeze outside is cooler than you expected. Most of the passengers have gathered along the forward rail, but you find a place farther along where you can watch the city come into view. Lezano's pale buildings rise behind the harbor, with green hills stretching inland.

A Wingull lands on the railing near a contestant holding a breakfast roll. The contestant breaks off a piece, but a deckhand asks him not to feed the wild Pokémon. He puts it away, and the Wingull gives an indignant cry before flying off toward a fishing boat.

You stay until the ferry sounds its arrival bell. Down on the working deck, the crew's Machoke is already guiding a cart of luggage toward the exit. You take one last look across the water, then head inside to collect your own bag.

*continue dock_approach

*chapter Chapter 2: Orientation

*passage dock_approach
*title Lezano Harbor
*journal saw_champ "A contestant with CHAMP embroidered on his jacket shoved past you on the ferry's gangway."

The ferry settles against the quay with a gentle bump, and the last of the engine's vibrations fades beneath your feet. Outside, Lezano is considerably larger than it appeared from the water. Rows of cream and terracotta buildings climb the hills beyond the harbor, their balconies crowded with flowers and laundry drying in the morning sun. Narrow streets wind between them, occasionally opening into little squares where cafés have arranged tables beneath colorful awnings. Farther uphill, the white columns of an enormous building rise above the rooftops.

The harbor is bustling with activity. Fishing boats are unloading their morning catches, dockworkers are moving crates between warehouses, and several Machoke are helping the ferry crew transfer luggage onto waiting carts. Red-and-gold banners hang from windows, lampposts, and balconies. A crowd has gathered along the waterfront to welcome the contestants, and a few reporters have already found people willing to give interviews.

When the crew opens the doors, you join the procession making its way down the gangway. The fresh sea air is a relief after the crowded lounge, and you slow a little to take in the city. You're halfway to shore when someone pushes past you, knocking your shoulder hard enough that you have to catch yourself against the railing. The young man has dark hair and a green jacket with [b]CHAMP[/b] embroidered across the back in large gold letters. "Could you walk any slower?" he snaps, glancing over his shoulder. "Some of us would actually like to get off this boat today, you know."

*choice
#Confront him about his rudeness -> lezano_arrival [set rival_response "confront"]
#Ignore him and keep walking -> lezano_arrival [set rival_response "ignore"]

*passage lezano_arrival
*title Lezano Harbor

*show_if rival_response == "confront"
"Kinda rude there, 'champ'," you say, making sure to emphasize the last word in the most mocking way possible. "Getting to shore a few seconds sooner isn't going to really matter now, is it?"

*show_if rival_response == "confront"
He stops and gives you an irritated look. For a moment, you think he might actually argue with you, but then he glances toward the dock and shakes his head. "Whatever. Not worth my time." Before you can respond, he's already making his way down the remaining stretch of gangway, squeezing past another contestant as he goes.

*show_if rival_response == "ignore"
You decide he isn't worth the trouble and continue walking. The young man doesn't wait for an answer anyway. He's already pushing his way around the next passenger, earning an angry complaint from an older man who nearly drops his tripod and bag in the process. A deckhand calls for him to slow down, but he seems determined to get off the ferry ahead of everyone else.

Once your feet are finally on solid ground, you take a moment to get your bearings. The waterfront is even livelier up close. A street musician is playing an accordion nearby, and the cheerful music carries over the conversations and the sharp calls of Wattrel wheeling above the fishing boats. Between the harbor and the streets beyond, several vendors have set up their stalls, apparently hoping to take advantage of the sudden influx of visitors.

A little farther along the wharf, a row of temporary booths stands beneath red-and-gold awnings bearing the Aurelian League emblem. Large signs reading [b]CONTESTANT CHECK-IN[/b] direct the arriving trainers toward them. Volunteers are checking names against tablets and handing out welcome packets. The line moves surprisingly quickly, and before long, you reach the front.

*continue lezano_checkin

*passage lezano_checkin
*title Lezano Harbor
*set credits 100
*set dex_installed true
*add_item league_badge 1
*add_item city_map 1
*add_item hotel_assignment 1
*journal league_registered "You checked in at Lezano, received your League badge and city map, and learned that orientation is at four o'clock."
*journal installed_pokedex_app "A League volunteer helped you install the Pokédex app on your phone at Lezano Harbor."

"Welcome to Lezano!" says a friendly-looking woman in a red League polo shirt. "Could I have your name, please?" You give her your name, and she finds your entry on her tablet.

After checking your information, she retrieves a packet from beneath the counter and passes it to you. Inside are your contestant identification badge, a hotel room assignment, and a surprisingly detailed map of the city. Several important locations have been highlighted, including the Pokémon Center, the waterfront markets, the League reception center, and a large public square labeled the Lezano Civic Forum.

"Your orientation is at four o'clock this afternoon, at the Civic Forum," she explains, pointing out the square on your map. "It's just up the hill from the harbor, and there'll be signs along the way, so you shouldn't have any trouble finding it. Until then, you're free to explore the city, get something to eat, or settle into your hotel room. Your accommodations have already been arranged, and all of your luggage will be delivered directly to your room, so you won't have to worry about carrying anything around."

"That's wonderful, thank you," you say, smiling at the nice lady.

She taps your identification badge. "This also serves as your debit card. The League has already loaded it with a starting balance of 100 credits, which should help you get settled in. All the shops here accept credits exclusively, so you won't be able to use any other currency while you're in Lezano. There's lots of ways to make credits, which they'll go over during orientation. Make sure you keep your badge on you at all times!"

"Before you go, could I see your phone?" she asks. She shows you a little card with a code on it and helps you install the League's Pokédex app. It opens to an empty notebook with a search field. "It won't fill itself in just because you've passed a Pokémon on the street. You have to choose to look one up, and then you can keep a note of where you saw it. The information's available without a signal once you've saved an entry." She waits while you try the controls and hands your phone back.

She indicates the location of your hotel on the map and wishes you luck before turning to greet the next contestant. You step aside to let the line continue moving. For the first time since leaving home, there's no particular reason to hurry.

*continue harbor_lookup

*passage harbor_lookup
*title Lezano Harbor
*hide_title

A Machoke in a blue vest is guiding one of the last luggage carts away from the ferry. Above the moored fishing boats, a Wattrel settles on a post and looks around before launching itself into the breeze again. Both are familiar enough sights in a working harbor, but the new app on your phone makes you a little more curious about them. You could look one up now, or leave your phone in your pocket.

*choice
#Look up Machoke in your new Pokédex -> harbor_scan_machoke
#Look up Wattrel in your new Pokédex -> harbor_scan_wattrel
#Put your phone away and make some plans -> harbor_destination

*passage harbor_scan_machoke
*title Looking Up Machoke
*hide_title
*journal scanned_machoke_harbor "You looked up Machoke while it was guiding luggage carts at Lezano Harbor."

You enter Machoke's name while the porter directs the cart toward the hotel vehicles. The Pokédex finds the species and saves your first note: the Machoke you saw was moving luggage for the harbor crew. You take one last look at the working Pokémon before putting the phone away.

*continue harbor_destination

*passage harbor_scan_wattrel
*title Looking Up Wattrel
*hide_title
*journal scanned_wattrel_harbor "You looked up Wattrel after watching it fly above Lezano Harbor."

You find Wattrel in the Pokédex and save a note about the little bird you saw taking off from a harbor post. It rides the sea breeze for a moment before turning toward the fishing boats. By the time you've finished, it's a small dark speck against the water.

*continue harbor_destination

*passage harbor_destination
*title Lezano Harbor
*hide_title

You fold the map and consider your options. Your hotel isn't far, and after a morning aboard the ferry, a little time to yourself sounds appealing. On the other hand, you haven't had a proper meal since breakfast, and the smells drifting from the waterfront restaurants are becoming increasingly difficult to ignore.

*choice
#Head to the hotel and check out your room -> hotel_route
#Find somewhere nice to eat -> food_route

*passage hotel_route
*title The Portico Hotel
*hide_title

The map takes you away from the busy waterfront and into a quieter street where climbing vines shade the balconies. Your hotel, the Portico, occupies a pale stone building with a courtyard out front. Someone has set a bowl of water beside the steps for passing Pokémon, and the lobby smells of lemon polish and fresh flowers. A Minccino is dusting the reception counter with its tail while the clerk sorts room keys behind it.

Before the clerk can hand you your key, a young woman in a dark blue jacket approaches him. She's been told her suitcase was delivered, but it isn't in her room. "It has a red ribbon on the handle," she explains. "I watched them load it onto the cart at the ferry. There's a journal inside that belonged to my mother, and I can't replace it." The clerk checks a tablet, then asks a porter to search the baggage room. After several minutes the porter returns empty-handed. The woman looks toward the luggage carts passing the lobby doors, trying to decide whether to follow them.

You could offer to help, although the hotel staff may be better placed to track the delivery. The Minccino is still polishing a brass lamp on the counter, apparently oblivious to the trouble.

*choice
#Offer to help the contestant find her suitcase -> hotel_investigate [set hotel_response "help"]
#Look up the Minccino on your Pokédex while you wait -> hotel_minccino [set hotel_response "scan"]
#Leave the search to hotel staff and head upstairs -> hotel_staff [set hotel_response "leave"]

*passage hotel_minccino
*title The Lobby Minccino
*hide_title
*journal scanned_minccino_hotel "You looked up a Minccino polishing the reception counter at the Portico Hotel."

You open the new app and find Minccino's entry while it works its way around the lamp. When you look up again, the young woman is speaking more urgently to the clerk, who tells her there's another delivery list in the office. She catches sight of your phone and looks away. You put it back in your pocket, aware that you've spent several minutes learning about a Pokémon while she waited for news of her suitcase.

*choice
#Put the phone away and offer to help her -> hotel_investigate [set hotel_response "latehelp"]
#Accept your room key and leave the search to the staff -> hotel_staff [set hotel_response "scan_leave"]

*passage hotel_investigate
*title Following a Lead
*hide_title
*journal met_victra "You met Victra while trying to trace her missing suitcase at the Portico Hotel."

*show_if hotel_response == "help"
You introduce yourself to the woman and offer to help. Her shoulders relax a little. "I'm Victra. I don't want to make a fuss, but my mother's journal is the reason I brought that suitcase instead of a smaller one." She tells you that she'd checked the luggage tag twice before the crew took it away.

*show_if hotel_response == "latehelp"
You approach the woman and apologize for getting distracted. "I'm Victra," she says after a moment. "If you really want to help, I won't turn you away. My mother's travel journal is in that suitcase, and the hotel hasn't been able to tell me where it went." She explains how the crew attached a paper delivery tag before taking it from the ferry.

The porter returns with news that two cases with red ribbons were unloaded together. One was sent upstairs to a room on the fourth floor, but neither of the guests assigned to that floor is Victra. The clerk can't search occupied rooms without permission. There's also an annex across the courtyard where excess luggage is stored until its owner can be identified. The parcel counter there closes at three, and you can see Victra calculating how long she has before orientation.

*choice
#Ask the clerk to compare the ferry and hotel delivery lists -> hotel_manifest [set hotel_clue "manifest"]
#Follow the porter and inspect the unclaimed luggage tags -> hotel_carts [set hotel_clue "tags"]

*passage hotel_manifest
*title A Missing Delivery
*hide_title

The clerk takes you into a small office behind reception, where a printer is still feeding out sheets of room assignments. The ferry's luggage list records Victra's room correctly, but the hotel's copy shows a second room number written in beside it. The clerk frowns. "Someone must have copied the wrong line when they divided the carts. Those bags were supposed to go to the annex for checking, not straight to the rooms."

He phones the annex. They have a red-ribboned case, but the tag was damaged in transit, and the staff won't release it without the owner's badge. Victra has the badge and the original receipt, so there's still a chance to retrieve it before the parcel counter closes.

*continue hotel_followup

*passage hotel_carts
*title The Porter’s Route
*hide_title

The porter takes you through a side door into a covered loading area, where the last carts are being unloaded. None of the cases has a red ribbon. He checks the room tags one by one anyway, then notices that an entire cart from the ferry has been marked for the annex rather than the hotel. "That wasn't in my handover," he says, turning the clipboard toward you. "The annex is across the courtyard. They'll want the owner's badge and delivery receipt."

Victra still has both. The only problem is time. The parcel window closes at three, and the porter needs to finish his deliveries before he can go with her.

*continue hotel_followup

*passage hotel_followup
*title The Last Step
*hide_title

Victra has enough information now to find the annex, but she looks reluctant to let the suitcase out of her sight again. The clerk offers to call ahead and put a note on the claim. He also has your room key waiting, and you have your own things to unpack. You could accompany Victra to the annex, or leave her the directions and let her collect the case herself.

*choice
#Go with Victra and help retrieve the suitcase -> hotel_resolution [set hotel_followup "accompany"]
#Give Victra the directions and head up to your room -> hotel_resolution [set hotel_followup "directions"]

*passage hotel_staff
*title The Hotel Staff
*hide_title

You accept your key and let the clerk continue his search. From the lifts you can still hear him making calls, asking the baggage team to check the annex and compare their room assignments. The young woman remains by the desk with her receipt in hand. Her case is still missing when the doors close, but at least the staff have begun tracing where it might have gone.

*continue hotel_resolution

*passage hotel_resolution
*title A Room at Last
*hide_title
*if hotel_followup == "accompany"
  *set victra_case "recovered"
  *journal victra_suitcase "You accompanied Victra to the annex and helped retrieve her mother's travel journal."
*if hotel_followup == "directions"
  *set victra_case "pending"
  *journal victra_directions "You found a lead on Victra's suitcase but left her to collect it."
*if hotel_response == "leave"
  *set victra_case "unknown"
*if hotel_response == "scan_leave"
  *set victra_case "unknown"

*show_if hotel_followup == "accompany"
The annex is farther around the courtyard than you expected, and by the time you find its narrow office there's a short line at the counter. Victra keeps her receipt ready while the attendant searches the shelves. At last he brings out a suitcase with a red ribbon and a torn room tag. Victra checks the lock and opens the side pocket just far enough to find the worn leather journal. "There it is," she says quietly. She closes the suitcase and thanks you for staying with her. When you return to the hotel she gives you a small smile and says she'll look for you at orientation.

*show_if hotel_followup == "directions"
You show Victra the annex on the delivery sheet and make sure she knows what to bring. "I can manage from here," she says, looking between her badge and the directions. She thanks you for finding the lead, although she won't know whether the suitcase is hers until she gets to the counter. You leave her with the clerk, who promises to telephone the annex again if she needs help.

*show_if hotel_response == "leave"
You reach your floor before the clerk has called back. You don't know whether the missing case was ever found, but the last thing you heard was the porter asking someone to check the annex.

*show_if hotel_response == "scan_leave"
You reach your floor with Minccino's entry saved on your phone and the clerk's last words still in your ears: the suitcase hasn't turned up. You hope the staff manage to trace it before the girl has to leave for orientation.

Your room overlooks a courtyard planted with lemon trees. Your luggage has arrived intact and is waiting on a stand beside the wardrobe. There's a neatly made bed, a writing desk, and a balcony just large enough for a chair. You put down your welcome packet, open the balcony door to let in some air, and take a few minutes to unpack.

*continue hotel_wingull

*passage hotel_wingull
*title A Visitor on the Balcony
*hide_title

A Wingull lands on the balcony railing and takes an interest in the empty water glass beside your chair. You watch it investigate the rim, then turn its head to look at you. The little visitor seems content to stay where it is, and your phone is close at hand.

*choice
#Look up Wingull and save a note about your visitor -> hotel_scan_wingull
#Leave the Wingull undisturbed and enjoy the quiet -> orientation_invitation

*passage hotel_scan_wingull
*title Looking Up Wingull
*hide_title
*journal scanned_wingull_hotel "You looked up Wingull after one landed on your hotel balcony."

The Pokédex finds Wingull, and you add a note about the one perched outside your room, eyeing your water glass. The Pokémon stays long enough for you to watch it spread its wings, then glides down into the courtyard.

*continue orientation_invitation

*passage food_route
*title The Salt and Thyme
*hide_title

The waterfront is full of places to eat, but a little café called the Salt and Thyme catches your attention. Its terrace looks out over the fishing boats, and the chalkboard by the door promises tomato soup, warm bread, and grilled sandwiches. You take a table beneath a striped awning while a server brings you a menu. The prices are marked in credits, just as the woman at registration said they would be.

You're deciding what to order when you hear a startled cry from the next table. A Wattrel has become tangled in a length of decorative cord hanging from the awning. It beats its wings and twists, catching the cord around one foot. The cord tightens with each movement, and a glass lantern hanging from the same frame begins to swing over a table where two people are eating. The server calls for help, but nobody is close enough to reach the cord without climbing onto a chair.

A young woman wearing a League badge steps toward the struggling Pokémon. "Don't grab its wings," she tells a customer trying to reach up. "You'll only frighten it more. Someone needs to steady that frame, and those people need to get away from the lantern." You have time to do one thing immediately. The Pokédex app is on your phone, too, but looking at a screen would mean leaving the others to react without you.

*choice
#Steady the awning frame while someone moves the lantern -> food_emergency [set restaurant_response "steady"]
#Help the server clear diners away from the swinging lantern -> food_emergency [set restaurant_response "clear"]
#Look up Wattrel in the Pokédex before getting involved -> food_emergency [set restaurant_response "scan"]

*passage food_emergency
*title A Difficult Rescue
*hide_title
*if restaurant_response == "scan"
  *set livia_impression "distracted"
  *journal scanned_wattrel_emergency "You looked up Wattrel while it struggled in the restaurant awning."
  *journal delayed_restaurant_help "You checked the Pokédex while a Wattrel was in immediate danger, delaying your help."
*if restaurant_response == "steady"
  *set livia_impression "helpful"
*if restaurant_response == "clear"
  *set livia_impression "helpful"

*show_if restaurant_response == "steady"
You brace yourself beside the nearest support and hold it while the server unhooks the lantern. The frame stops shaking, but the Wattrel is still tangled, and it cries out whenever the cord pulls against its foot. The young woman looks up at the knot and asks the server to find something they can stand on safely.

*show_if restaurant_response == "clear"
You help the server get the diners away from the hanging glass, including an older man who insists on collecting his coat before moving. By the time everyone is clear, the frame has begun to tilt toward the terrace. The young woman catches the support with both hands, but she can't reach the cord while she's holding it.

*show_if restaurant_response == "scan"
You take out your phone and open Wattrel's entry, hoping that knowing more about it will help. The app tells you about a small Electric- and Flying-type Pokémon that lives along coasts, but before you can finish reading, the lantern strikes the edge of a table and breaks. The server pulls a customer away from the falling glass. Nobody is badly hurt, although the server gets a shallow scratch on one hand while moving a chair. The young woman takes hold of the awning support and looks at your phone. "We can read about it later," she says, keeping her attention on the bird above you.

The Wattrel is still caught. Its foot is trapped beneath two loops of cord, and reaching up without frightening it will take some care. The woman asks for a step stool and a clean cloth. The server has gone to find a first-aid kit, so you offer to get whichever thing will help her most.

*choice
#Fetch a step stool so she can reach the knot safely -> food_resolution [set restaurant_followup "stool"]
#Bring a clean cloth to cover and calm the Wattrel -> food_resolution [set restaurant_followup "cloth"]

*passage food_resolution
*title A Table by the Water
*hide_title
*add credits -12
*journal met_livia "You met Livia at the Salt and Thyme while helping free a tangled Wattrel."
*journal helped_wattrel "You helped free a Wattrel caught in the Salt and Thyme's awning."
*if livia_impression == "helpful"
  *journal livia_grateful "Livia was grateful you acted quickly during the Wattrel rescue."
*if livia_impression == "distracted"
  *journal livia_disappointed "Livia noticed you spent time on your Pokédex while the Wattrel needed help."

*show_if restaurant_followup == "stool"
You return with the step stool while the server holds the frame steady. The woman climbs just high enough to see where the knot has caught, then works at it with her fingers, loosening each loop before moving to the next. You keep the stool steady as Wattrel starts to struggle again. Its foot finally comes free, and it hops onto the awning, shakes its wings, and flies toward the harbor.

*show_if restaurant_followup == "cloth"
You bring the cloth and fold it so the woman can shield Wattrel's eyes without pressing on its wings. Its frantic movements begin to settle, giving her time to ease the cord from its foot. The server helps support the frame, and you keep a hand ready beneath the bird in case it loses its grip. Wattrel hops away from the loosened cord, pauses at the edge of the awning, and takes off over the water.

*show_if livia_impression == "helpful"
The young woman steps down and introduces herself as Livia. She thanks you for helping when there wasn't much time to think. "The poor thing panicked as soon as it couldn't move," she says. "I'm glad nobody tried to pull it loose by force." She asks whether you're entering the League too, and the two of you talk while the server resets the terrace.

*show_if livia_impression == "distracted"
The young woman introduces herself as Livia after checking that the server's scratch has been cleaned. "I know the Pokédex can be useful," she says, glancing toward your phone, "but I was hoping someone would help before the glass came down." She doesn't press the point. She asks whether you're entering the League and takes a seat while the staff clear away the last broken pieces.

Once things have settled, the server brings your soup and bread. It costs twelve credits, which you pay by tapping your badge against the reader. Livia is still at the table, watching to make sure the Wattrel doesn't return to the awning. You could look it up now that everyone's safe, or finish your meal without opening the app again.

*choice
#Look up Wattrel now and record what happened -> food_scan_wattrel
#Put your phone away and enjoy your lunch -> orientation_invitation

*passage food_scan_wattrel
*title Looking Up Wattrel
*hide_title
*journal scanned_wattrel_rest "You looked up Wattrel after helping free one from the Salt and Thyme awning."

You open Wattrel's entry and add a note about the bird that caught its foot in the awning. This time there's no swinging glass and no frightened Pokémon waiting for help. You finish your note, put your phone down, and return to your lunch.

*continue orientation_invitation

*passage orientation_invitation
*title Plans for the Afternoon
*hide_title

*show_if lucia_contact == true
By the time you've had a chance to relax, your phone is ringing. Lucia's name appears on the screen. "Hi, ${trainer_name}! I hope I'm not interrupting anything. I made it through registration without getting lost, and I was wondering if you'd like to walk to orientation together. We could meet by the fountain at the harbor around half past three. It's supposed to be easy to find, but I'd feel better going with someone I know." She gives a small laugh. "No pressure, of course. I just thought I'd ask."

*show_if lucia_contact == false
You check the time. Orientation doesn't begin until four, and you still have a while before you'll need to start uphill toward the Civic Forum. The map marks a direct route from the waterfront, along with a longer way through some of Lezano's smaller shopping streets. It might be pleasant to see a little more of the city before everyone gathers.

The map is folded beside your badge, ready whenever you are. The Civic Forum is only a short walk away, but there's no need to arrive immediately.

*choice
#Agree to meet Lucia by the harbor fountain -> orientation_with_lucia [if lucia_contact == true]
#Head to the Civic Forum on your own -> orientation_alone
#Take the scenic route through the shopping streets -> orientation_scenic [if lucia_contact == false]

*passage orientation_with_lucia
*title Meeting Lucia
*hide_title
*journal lucia_orientation_plans "You arranged to meet Lucia at the harbor fountain before orientation."

"That sounds lovely," you tell Lucia. You agree to meet beside the harbor fountain at half past three, leaving enough time to walk to the Civic Forum together. She promises not to get distracted by every Pokémon along the way, although she doesn't sound entirely confident about it. After the call, you check your map once more and put your badge somewhere you can reach it easily.

*passage orientation_alone
*title Going on Your Own
*hide_title

*show_if lucia_contact == true
You thank Lucia for calling but tell her you'll make your own way to the Civic Forum. She sounds a little disappointed, then cheerfully says she'll look for you inside. You end the call with plenty of time to get there.

*show_if lucia_contact == false
You decide to take the direct route to the Civic Forum and save the shopping streets for another day.

With the city map and your League badge in hand, you make your way toward the hill above the waterfront. The afternoon is still yours for a little while, and the Forum will be easy enough to find.

*passage orientation_scenic
*title A Longer Walk
*hide_title

You take the longer route marked on your map, following a street of small bookshops, bakeries, and open-fronted market stalls. A shopkeeper is watering the flowerpots outside her door, and the scent of baking drifts from somewhere around the corner. You keep an eye on the time as you wander, knowing that the Civic Forum is waiting uphill when you're ready.
