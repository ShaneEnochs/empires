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
