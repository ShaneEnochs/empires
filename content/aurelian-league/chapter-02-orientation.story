*chapter Chapter 2: Orientation

*passage dock_approach
*title Lezano Harbor
*journal saw_champ "A contestant with CHAMP embroidered on his jacket shoved past you on the ferry's gangway."

The ferry settles against the dock with a gentle bump, and the last of the engine's vibrations fades beneath your feet. Outside, Lezano is considerably larger than it appeared from the water. Rows of cream and terracotta buildings climb the hills beyond the harbor, their balconies crowded with flowers and laundry drying in the morning sun. Narrow streets wind between them, occasionally opening into little squares where cafés have arranged tables beneath colorful awnings. Farther uphill, the white columns of an enormous building rise above the rooftops.

The harbor is bustling with activity. Fishing boats are unloading their morning catches, dockworkers are moving crates between warehouses, and several Machoke are helping the ferry crew transfer luggage onto waiting carts. Red-and-gold banners hang from windows, lampposts, and balconies. A crowd has gathered along the waterfront to welcome the contestants, and a few reporters have already found people willing to give interviews.

When the crew opens the doors, you join the procession making its way down the gangway. The fresh sea air is a relief after the crowded lounge, and you slow a little to take in the city. You're halfway to shore when someone pushes past you, knocking your shoulder hard enough that you have to catch yourself against the railing. The guy has dark hair and a green jacket with [b]CHAMP[/b] embroidered across the back in large gold letters. "Could you walk any slower?" he growls, glancing over his shoulder. "Some of us would actually like to get off this boat today."

*choice
#Confront him about his rudeness -> lezano_arrival [set rival_response "confront"]
#Ignore him and keep walking -> lezano_arrival [set rival_response "ignore"]

*passage lezano_arrival
*title Lezano Harbor

*show_if rival_response == "confront"
"Kinda rude there, 'champ'," you say, making sure to emphasize the last word in the most mocking way possible. "Getting to shore a few seconds sooner isn't going to really matter now, is it?"

*show_if rival_response == "confront"
He stops and gives you an irritated look. For a moment, you think he might actually argue with you, but then he glances toward the dock and shakes his head. "Whatever. Not worth my time." Before you can respond, he's already making his way down the remaining stretch of gangway, pushing past another contestant as he goes.

*show_if rival_response == "ignore"
You decide he isn't worth the trouble and continue walking. The young man doesn't wait for an answer anyway. He's already pushing his way around the next passenger, earning an angry complaint from an older man who nearly drops his tripod and bag in the process. A deckhand calls for him to slow down, but he seems determined to get off the ferry ahead of everyone else.

Once your feet are finally on solid ground, you take a moment to get your bearings. The waterfront is even livelier up close. A street musician is playing an accordion nearby, and the cheerful music carries over the conversations and the sharp cries of several Wattrel, small yellow-and-black seabird Pokémon wheeling above the fishing boats. Between the harbor and the streets beyond, several vendors have set up their stalls, apparently hoping to take advantage of the sudden influx of visitors.

A little farther along the wharf, a row of temporary booths stands beneath red-and-gold awnings bearing the Aurelian League emblem. Large signs reading [b]CONTESTANT CHECK-IN[/b] direct the arriving trainers toward them. Volunteers are checking names against tablets and handing out welcome packets. The line moves surprisingly quickly, and before long, you reach the front.

*continue lezano_checkin


*passage lezano_checkin
*title Lezano Harbor
*set credits 100
*set dex_installed true
*add_item league_bracelet 1
*journal league_registered "You registered for the Aurelian League in Lezano, received your silver League bracelet, and learned that orientation begins at four o'clock."
*journal installed_pokedex_app "Your League bracelet was activated, giving you access to your identification, credits, city map, hotel information, and Pokédex."

"Welcome to Lezano!" a woman in a red League polo shirt greets you as you approach the registration counter. "May I have your name, please?" You give it to her, and she searches through the list on her tablet. "Ah, there you are! Everything looks good. Now, let's get you all set up." She reaches beneath the counter and retrieves a small box bearing the League's familiar golden laurel emblem. Inside, resting on a cushion, is a slender silver bracelet with a polished oval set into its surface.

"This little thing is going to make your life a whole lot easier," she says, taking the bracelet from its box. "May I?" 

You offer her your wrist, and she fastens it comfortably in place. With a gentle tap against the oval, a pale blue light appears above your arm, forming a small, translucent display. Your name and contestant identification number appear at the top, accompanied by the League's emblem. 

"There we go! This is your official League bracelet. It serves as your identification, your wallet, your map, and quite a few other things. You'll want to keep it on throughout the competition."

*page_break

She shows you how to navigate the display, tapping through several neatly arranged icons. "We've already added your starting allowance of one hundred credits. All the shops here in Lezano use credits, so you can just tap your bracelet against a payment terminal whenever you buy something. You'll have opportunities to earn more during the competition, but they'll explain all that at orientation." 

Another tap brings up a detailed map of Lezano, complete with marked streets and several highlighted locations. "Your hotel information is in here, too. We've arranged your accommodations, and your luggage will be delivered straight to your room. You're welcome to get settled in or explore the city before orientation. That's at four o'clock this afternoon, at the Civic Forum. See? Right here." She points to a large square on the map, and a little golden line appears, marking the route from the harbor.

"Oh, and one more thing!" she adds, tapping an icon shaped like an open book. "This is your Pokédex! Whenever you come across a Pokémon you're curious about, you can look it up here. You'll find all sorts of information about different species, and you can even save notes about the Pokémon you meet." She shows you how to search for an entry, then returns to the main menu. "Anything you save will still be available when you're somewhere without a signal, which should come in handy once you start exploring."

*page_break

"Your bracelet also takes care of your Pokémon team," she continues, selecting another icon. The hologram changes to show six empty spaces arranged in a circle. "You won't need to carry Poké Balls around here. When a Pokémon agrees to join you, all it has to do is touch your bracelet, and it'll be registered as one of your partners. The bracelet can safely hold your Pokémon until you're ready to let them out, although League rules only allow you to have one out at a time." She gives you a reassuring smile. "Don't worry if that sounds a little complicated. They'll show you exactly how everything works at orientation. For now, just remember that a Pokémon has to be willing to join you. So don't try to pick one up and take it along. You probably won't like the results." She grins.

She gives you a moment to try the controls for yourself. The hologram responds easily to your touch, and after a little experimenting, you discover that tapping the bracelet's polished surface closes the display entirely. 

"Perfect! Looks like you've got the hang of it," she says, smiling. "Well, that's everything for now. Enjoy Lezano, and best of luck in the League!" You thank her and step aside to make room for the next contestant. With your registration complete and several hours to spare before orientation, you find yourself with something you haven't had much of since leaving home: time to do whatever you please.


*continue harbor_lookup


*passage harbor_lookup
*title Lezano Harbor
*hide_title

A Machoke in a blue crew vest is guiding one of the last luggage carts away from the ferry, carefully maneuvering it around a group of passengers waiting for their belongings. Above the moored fishing boats, a Wattrel settles on a wooden post, ruffles its feathers, and watches the activity below before launching itself back into the breeze.

You glance down at the silver bracelet around your wrist. You've barely had a chance to explore its features, and the Pokédex seems like a good place to start. With a tap against the polished oval, the familiar blue hologram appears above your arm, its little icons waiting for your selection. Perhaps you could try looking up one of the Pokémon you've just seen.

*choice
#Look up Machoke in your Pokédex -> harbor_scan_machoke
#Look up Wattrel in your Pokédex -> harbor_scan_wattrel
#Close the hologram and explore the city -> harbor_destination

*passage harbor_scan_machoke
*title Looking Up Machoke
*hide_title
*journal scanned_machoke_harbor "You looked up Machoke while it was guiding luggage carts at Lezano Harbor."

You select the Pokédex icon and type Machoke into the search field. A moment later, the hologram changes to display a small, rotating image of the Pokémon, accompanied by information about its species. You skim through the entry, occasionally glancing up at the real Machoke as it effortlessly lifts a heavy suitcase onto a waiting cart. It's rather interesting to see the information in front of you while watching the Pokémon go about its work.

You decide to save the entry, adding a little note about seeing Machoke helping the harbor crew with their luggage. A small confirmation appears, and you find yourself rather pleased to have made your first Pokédex entry. You close the hologram with another tap of your bracelet, just as the Machoke disappears around a corner with its cart.

*continue harbor_destination

*passage harbor_scan_wattrel
*title Looking Up Wattrel
*hide_title
*journal scanned_wattrel_harbor "You looked up Wattrel after watching it fly above Lezano Harbor."

You select the Pokédex icon and enter Wattrel into the search field. The hologram quickly brings up a little rotating image of the bird, along with information about its species and natural habitat. Apparently, Wattrel are quite fond of coastal areas, where they take advantage of the sea winds to travel long distances. You look up from the display just in time to see the little Pokémon circling above the fishing boats.

Smiling to yourself, you save the entry and add a note about the Wattrel you've spotted at the harbor. Your first Pokédex entry! It's a small beginning, perhaps, but you imagine how many more Pokémon you'll encounter during your travels. You give the little bird one last look before closing the hologram and turning your attention back to the city.

*continue harbor_destination

*passage harbor_destination
*title Lezano Harbor
*hide_title

You take another look at the map projected above your bracelet, considering what to do with the rest of your afternoon. Your hotel doesn't seem particularly far from the harbor, and after spending most of the morning aboard a crowded ferry, the thought of having a comfortable room to yourself is rather appealing. Then again, it's been hours since you've had anything to eat, and the wonderful smells drifting from the waterfront restaurants are becoming increasingly difficult to ignore.

There are plenty of little cafés and restaurants scattered along the harbor, their outdoor tables crowded with people enjoying the pleasant weather. You close the hologram and glance between the busy waterfront and the quieter streets leading into the city. There's still plenty of time before orientation, so perhaps you should make the most of it.

*choice
#Head to the hotel and check out your room -> hotel_route
#Find somewhere nice to eat -> food_route


*passage hotel_route
*title The Portico Hotel
*hide_title

Following the directions on your bracelet, you leave the busy waterfront behind and make your way through a series of quieter streets. The buildings here are mostly pale stone, with colorful flowers spilling from window boxes and climbing vines winding around the balconies. Your hotel, the Portico, occupies a lovely building overlooking a small courtyard. A few guests are sitting outside beneath the shade of a large tree, and someone has left a bowl of fresh water beside the entrance for any passing Pokémon.

Inside, the lobby is just as welcoming. The air smells faintly of lemon polish and fresh flowers, and a few comfortable armchairs have been arranged around a low table covered with magazines. Behind the reception counter, a Minccino is busily dusting a brass lamp with its tail while a young clerk sorts through some paperwork. The little Pokémon occasionally stops to inspect its work before giving the lamp another enthusiastic sweep.

You're about to approach the counter when a young woman in a dark blue jacket hurries over from the direction of the elevators. "Excuse me, I'm sorry to bother you again, but is there any news about my suitcase?" she asks the clerk. "I was told it had already been delivered to my room, but it isn't there. It's a brown suitcase with a red ribbon tied around the handle. I watched them load it onto the luggage cart before we left the ferry, so I know it made the trip."

The clerk gives her an apologetic look and checks his tablet. "I'm sorry, miss. It looks like your luggage was marked as delivered, but that doesn't necessarily mean it's reached your room. Let me ask one of our porters to check the baggage area."

"Thank you," she replies. "There's a journal inside that belonged to my mother, and I'd be absolutely devastated if something happened to it. I know it's probably just been misplaced, but I'd really like to find it."

The porter heads off to search for the suitcase, leaving the woman waiting anxiously near the counter.

*choice
#Offer her a few words of reassurance -> hotel_wait_reassure
#Give her some privacy and look around the lobby -> hotel_wait_quiet

*passage hotel_wait_reassure
*title A Little Reassurance
*hide_title

"I hope they find your suitcase soon," you tell her. She looks over at you, apparently surprised to be addressed. "Oh, thank you. I'm sure they will. I just wish I knew where it was." She manages a small smile before glancing toward the hallway where the porter disappeared.

*continue hotel_checkin

*passage hotel_wait_quiet
*title A Moment to Wait
*hide_title

You decide to give the woman some space while the staff sorts things out. The Minccino behind the counter has finished polishing its lamp and moved on to a small vase of flowers. It carefully wipes around the base with its fluffy tail, then steps back to inspect the result. At least somebody seems to be having a productive afternoon.

*continue hotel_checkin

*passage hotel_checkin
*title Checking In
*hide_title

While the porter searches the baggage room, the clerk turns his attention to you. "Sorry about the wait. You're here with the League, I assume?" You show him your bracelet, and he quickly finds your reservation. He confirms your room number and gives you directions to the elevators, explaining that your bracelet will also unlock your door.

You're just finishing up when the porter returns, unfortunately without the missing suitcase. He explains that he's checked the bags waiting to be taken upstairs, but none of them match the woman's description. The clerk promises to look into the delivery records, and she steps away from the counter, looking rather discouraged.

You could offer to help her search, although the hotel staff probably have a better idea of where the luggage might have ended up. Meanwhile, the Minccino is still occupied with its cleaning, apparently unaware of the trouble unfolding nearby.

*choice
#Offer to help the contestant find her suitcase -> hotel_investigate [set hotel_response "help"]
#Look up the Minccino in your Pokédex -> hotel_minccino [set hotel_response "scan"]
#Leave the search to hotel staff and head upstairs -> hotel_staff [set hotel_response "leave"]

*passage hotel_minccino
*title The Lobby Minccino
*hide_title
*journal scanned_minccino_hotel "You looked up a Minccino polishing the reception counter at the Portico Hotel."

You raise your wrist and tap the bracelet, bringing up the familiar blue hologram. After a quick search, Minccino's Pokédex entry appears, complete with a small, rotating image of the Pokémon. Apparently, Minccino are particularly fond of keeping their surroundings clean, using their fluffy tails to sweep away dust and dirt. You glance up at the real Minccino, which is polishing the edge of the reception counter. It pauses to inspect the nearby brass lamp, spots a smudge on its base, and immediately sets about cleaning it.

Amused by its dedication, you save the entry and add a note about seeing one working at the Portico Hotel. You're just finishing when you hear the young woman speaking to the clerk again. She's asking whether there's any way to track where her suitcase was taken after it left the ferry. The clerk mentions another delivery list kept in the back office, although he can't promise it will tell them anything useful.

The woman sighs and turns away from the counter, clutching her luggage receipt. She glances briefly at the hologram above your wrist before settling into one of the nearby armchairs. You'd been so absorbed in your new Pokédex that you'd almost forgotten about her missing suitcase. The hotel staff are still looking into it, but perhaps another pair of hands would help.

*choice
#Close your Pokédex and offer to help her -> hotel_investigate [set hotel_response "latehelp"]
#Leave the search to the staff and head upstairs -> hotel_staff [set hotel_response "scan_leave"]

*passage hotel_investigate
*title Following a Lead
*hide_title
*journal met_victra "You met Victra while trying to trace her missing suitcase at the Portico Hotel."

*show_if hotel_response == "help"
You approach the young woman and introduce yourself, explaining that you'd be happy to help look for her suitcase. She seems a little surprised by the offer, but her expression soon softens. "Oh, that would be wonderful. Thank you! I'm Victra, by the way." She glances toward the reception desk. "I know it's probably somewhere in the hotel, but I watched them put the luggage tag on it myself. It had my name and room number, so I don't understand how it could have gone missing."

*show_if hotel_response == "latehelp"
You close the hologram and approach the young woman, introducing yourself and offering to help with her missing suitcase. "Really? Oh, thank you. I'm Victra," she says, sitting up a little straighter. "I was starting to think I'd have to spend the whole afternoon waiting here." She shows you the luggage receipt she's been holding. "They gave me this when I handed over my suitcase on the ferry. I watched them attach the tag, too. Everything looked right, so I can't imagine where it's ended up."

The clerk calls the porter back over and asks him to take another look at the delivery sheet. "Well, there is something rather odd," the porter admits, spreading the list across the counter. "Two suitcases with red ribbons were unloaded together. One was delivered to a room on the fourth floor, but that isn't your room. I haven't been able to account for the other one."

"Could mine have been delivered to the wrong room?" Victra asks.

"It's possible," the clerk admits, examining the sheet. "Unfortunately, we can't go searching through another guest's room without their permission. There is somewhere else it might have ended up, though." He explains that the hotel has an annex across the courtyard where luggage is taken when there's a problem with its delivery information. Bags with damaged or unclear tags are held there until someone can confirm who they belong to.

"Well, could we check there?" Victra asks, looking hopeful.

"Certainly, although we'll need to find out whether your suitcase was sent over in the first place. The parcel counter also closes at three, so we haven't got a great deal of time."

Victra glances at the clock above the reception desk, then looks back at the delivery sheet. There must be some way to narrow down where her suitcase went, and you can think of a couple of places to start.

*choice
#Ask the clerk to compare the ferry and hotel delivery lists -> hotel_manifest [set hotel_clue "manifest"]
#Follow the porter and inspect the unclaimed luggage tags -> hotel_carts [set hotel_clue "tags"]

*passage hotel_manifest
*title A Missing Delivery
*hide_title

The clerk retrieves the hotel's delivery records from a small office behind reception and spreads several sheets across the counter. Victra leans forward to look as he compares them with the luggage information on his tablet. You notice that the ferry's manifest lists her name and room number correctly, but the hotel's copy has a different room number written beside her entry.

"That's strange," the clerk mutters, running a finger down the list. "It looks like someone mixed up two of the deliveries when the luggage was sorted." He checks another page, then stops. "Ah, here we are. The bags from that cart were supposed to be sent to the annex for inspection, but one was delivered upstairs instead. The other should still be there."

"Does that mean you've found mine?" Victra asks.

"Possibly. Let me check." He picks up the telephone and calls the annex. After a brief conversation, he looks considerably more cheerful. "They do have an unidentified suitcase from the Portia, but the luggage tag was damaged, so they haven't been able to establish who owns it."

Victra holds up the receipt she's been carrying since the ferry. "I've still got this. And my League identification is on my bracelet."

"Those should help," the clerk replies. "You'll need to get over there before three, though. That's when the parcel counter closes."

*continue hotel_followup

*passage hotel_carts
*title The Porter's Route
*hide_title

The porter leads you and Victra through a side door into the hotel's covered loading area. Several luggage carts are lined up against the wall, and a pair of workers are sorting the last deliveries from the ferry. The porter explains the situation to them, and together you begin checking the luggage that hasn't yet been taken upstairs.

There are plenty of suitcases, but none with a red ribbon. Victra examines each one carefully, occasionally checking the receipt in her hand. "I know it was on the cart when we left the ferry," she says. "I remember worrying that the ribbon might come loose, so I made sure it was tied properly."

The porter takes another look at his clipboard. "Hang on a moment. We're missing an entire cart from the ferry." He points to a note beside a group of luggage numbers. "It was redirected to the annex before it reached the hotel. That wasn't included in my handover."

"So some of the luggage was sent to the annex after all?" Victra asks.

"Yes. The bags were set aside because their delivery information didn't match." He checks the number on her receipt against the list, then looks up. "Your suitcase was assigned to that cart. I can't promise it's still there, but I'd certainly start with the annex."

Victra looks relieved to have something to go on. "Thank you! Do you think someone could take us over?"

"I'd be happy to, but I've still got a few deliveries to finish. The parcel counter closes at three, though, so you might be better off going ahead. Just show them your receipt and your League identification."

*continue hotel_followup

*passage hotel_followup
*title The Last Step
*hide_title

With a possible location for her suitcase, Victra seems considerably happier than she did a few minutes ago. She checks the time on her bracelet, then looks toward the courtyard. The annex isn't far, and there's still enough time to collect the luggage before orientation, provided it really is hers.

"Well, I suppose I'd better get going," she says. "You've helped me figure out where to look, and I really appreciate it."

You could offer to accompany Victra to the annex, especially since there's still no guarantee her suitcase is there. On the other hand, she seems perfectly capable of handling things herself, and your own room is waiting upstairs. There's still plenty of time before orientation, so it's really a matter of how you'd like to spend the rest of your afternoon.

*choice
#Go with Victra and help retrieve the suitcase -> hotel_annex [set hotel_followup "accompany"]
#Give Victra the directions and head up to your room -> hotel_victra_directions [set hotel_followup "directions"]

*passage hotel_annex
*title The Luggage Annex
*hide_title

The annex is tucked away on the far side of the courtyard, beyond a covered walkway lined with potted plants. Inside, a short queue has formed at the parcel counter, where an attendant is sorting through a stack of luggage receipts. Victra waits beside you, occasionally peering through the doorway into the storage room.

When you finally reach the counter, she explains the situation and presents her receipt along with the identification displayed on her bracelet. The attendant checks his computer, but after several minutes of searching, he shakes his head.

"I'm sorry, miss. I'm not finding anything under your name. If the luggage tag was damaged, the suitcase might have been recorded without an owner."

"But the hotel thought my suitcase might have been sent here," Victra says. "Couldn't we check whether you've got it?"

"We can try, certainly. We've got quite a few unidentified bags, though. Is there anything else you can tell me about it?"

Victra looks down at her receipt. Perhaps there's another way to narrow the search.

*choice
#Ask the attendant to check the ferry's delivery records -> hotel_annex_number
#Suggest searching the descriptions of unidentified luggage -> hotel_annex_description

*passage hotel_annex_number
*title Checking the Records
*hide_title

You point to the delivery batch number printed near the top of Victra's receipt. "Could you search for luggage from this batch? Maybe her suitcase was recorded under the ferry's information instead of her name."

"That's worth trying." The attendant enters the number and studies the results. "Two bags from that delivery came in without complete tags. One's a brown suitcase with a red ribbon."

Victra leans forward. "That sounds like mine!"

"It certainly could be. Let me bring it out so we can have a look."

*continue hotel_annex_case

*passage hotel_annex_description
*title A Possible Match
*hide_title

"Could we check the descriptions of the unclaimed luggage?" you suggest. "She said hers was brown with a red ribbon around the handle. There can't be too many that look exactly like that."

The attendant opens another list on his computer. "Let's see. We've got several brown suitcases, but..." He scrolls farther down the page. "Here we are. One brown case with a red ribbon, delivered from the Portia this morning. The tag was torn, so we couldn't work out which room it belonged to."

"That must be it!" Victra says.

"It sounds promising. I'll bring it out, and we'll see what we can establish."

*continue hotel_annex_case

*passage hotel_annex_case
*title The Unclaimed Suitcase
*hide_title

The attendant disappears into the storage room and returns a minute later, wheeling a brown suitcase with a red ribbon tied around its handle. Victra immediately steps forward.

"That's my suitcase! I'm sure of it!"

"It certainly matches your description," the attendant agrees. "I'm afraid I still need to verify that it belongs to you before I can release it. The luggage tag is torn, and I can't make out the passenger's name."

He turns the suitcase so you can see the damaged tag hanging from its handle. Most of the information has been lost, although a few numbers remain visible along the bottom.

Victra looks disappointed to have come so close without being able to collect her belongings. Perhaps there's something else that could help establish ownership.

*choice
#Compare the remaining numbers on the tag with her receipt -> hotel_annex_tag
#Ask Victra whether there's a distinctive mark on her suitcase -> hotel_annex_mark

*passage hotel_annex_tag
*title A Matching Number
*hide_title

You lean closer to examine the damaged luggage tag. Most of the information is missing, but a few digits remain along the bottom. You ask Victra to show you her receipt again and carefully compare the numbers.

"Look at this," you tell the attendant. "These last few digits match the claim number on her receipt."

He examines the tag, then checks the receipt himself. "You're right. Let me check that against the ferry's records." After a moment, he nods. "That's a match. And your identification agrees with the passenger information here, miss. I think we've got everything we need."

Victra gives you a relieved smile. "Good catch! I wouldn't have thought to look at the torn part."

*continue hotel_annex_recovered

*passage hotel_annex_mark
*title A Familiar Detail
*hide_title

"Is there anything unusual about your suitcase?" you ask Victra. "A scratch, a mark, something that would help prove it's yours?"

She studies the case for a moment, then brightens. "Actually, yes! There's a little dent near one of the wheels. I dropped it down some stairs last year and never managed to get it fixed."

The attendant tips the suitcase slightly, allowing you both to inspect the bottom. Sure enough, there's a noticeable dent in the corner beside one of the wheels.

"That's the one!" Victra says. "And the ribbon has a little bit of green stitching near the knot. My mother put that there to keep it from fraying."

You check the ribbon and find the stitching exactly where she described. The attendant compares her receipt and identification against the ferry's delivery records once more. "Well, those details are certainly convincing. Everything else matches, too. I'm satisfied this is your suitcase."

*continue hotel_annex_recovered

*passage hotel_annex_recovered
*title Found at Last
*hide_title
*set victra_case "recovered"
*journal victra_suitcase "You accompanied Victra to the annex and helped retrieve her mother's travel journal."

The attendant releases the suitcase, and Victra immediately checks the lock before opening the side pocket. She reaches inside and pulls out a small, worn leather journal. For a moment, she simply holds it, running her thumb along the cover.

"Oh, thank goodness," she says quietly. She opens the journal just long enough to check the first few pages, then carefully returns it to the suitcase. When she looks up at you, she's smiling. "I was getting so worried about this. Thank you for helping me find it."

You accompany her back to the hotel, where she seems considerably more cheerful than when you first met. As you reach the lobby, she turns toward you. "Well, I think I've had enough excitement for one afternoon. I'm glad everything worked out."

*continue hotel_victra_contact_offer

*passage hotel_victra_directions
*title A Promising Lead
*hide_title
*set victra_case "pending"
*journal victra_directions "You found a lead on Victra's suitcase but left her to collect it."

You help Victra find the annex on her bracelet's map and make sure she knows which entrance to use. She checks that she still has her luggage receipt, then adjusts the strap of her bag.

"I think I can manage from here," she says. "Thanks for helping me figure out where to go. Hopefully they've got the right suitcase."

You wish her luck, and she gives you a grateful smile before preparing to set off across the courtyard.

*continue hotel_victra_contact_offer

*passage hotel_victra_contact_offer
*title Keeping in Touch
*hide_title

"Actually, before I go, could I add you as a contact?" Victra asks. "We're both here for the League, and it would be nice to know someone when we get to orientation. Maybe we'll run into each other again."

*choice
#Exchange contact details with Victra -> hotel_victra_contact_yes
#Politely decline -> hotel_victra_contact_no

*passage hotel_victra_contact_yes
*title A New Contact
*hide_title
*journal victra_contact_shared "You exchanged contact information with Victra at the Portico Hotel."

You bring up the contacts menu on your bracelet and exchange details with Victra. She checks that your name has appeared, then smiles. "There we go! Maybe I'll send you a message later and see how your first day is going."

You say goodbye, and she gives you a small wave before you go your separate ways.

*continue hotel_resolution

*passage hotel_victra_contact_no
*title Another Time
*hide_title

You'd rather not exchange contact details just yet. "Oh, that's fine!" Victra says. "I'm sure we'll see each other around anyway. There are only a hundred of us, after all."

You wish her luck, and she gives you a friendly wave before you go your separate ways.

*continue hotel_resolution

*passage hotel_staff
*title The Hotel Staff
*hide_title

You decide to leave the search to the hotel staff. After all, they're the ones responsible for delivering the luggage, and they seem to be doing what they can to find it. The clerk assures the young woman that he'll contact the hotel's luggage annex to see whether her suitcase was sent there by mistake. She thanks him and settles into one of the nearby armchairs, keeping her receipt close at hand.

You leave them to it and make your way toward the elevators, tapping your bracelet against the panel to call one. While you wait, you can hear the clerk speaking on the telephone, describing the missing suitcase to someone on the other end. The elevator arrives a moment later, and you step inside, leaving the staff to continue their search.

*continue hotel_resolution

*passage hotel_resolution
*title A Room at Last
*hide_title
*if hotel_response == "leave"
  *set victra_case "unknown"
*if hotel_response == "scan_leave"
  *set victra_case "unknown"

*show_if hotel_followup != "none"
With Victra heading off to continue her afternoon, you make your way to the elevators and head upstairs.

*show_if hotel_response == "leave"
You wonder briefly whether the staff have managed to locate the missing suitcase. The clerk seemed determined to sort things out, and you hope the young woman gets her belongings back before orientation.

*show_if hotel_response == "scan_leave"
You glance at your bracelet, where Minccino's Pokédex entry is safely recorded. The woman downstairs is still waiting for news of her suitcase, though, and you hope the staff have something to tell her soon.

The elevator opens onto a quiet corridor. You follow the room numbers until you find your door.

*page_break

You tap your bracelet against the reader beside your hotel room door. The lock clicks, and you step into a bright room overlooking a courtyard planted with lemon trees. Your luggage is waiting beside the wardrobe. There's a neatly made bed, a writing desk near the window, and a small balcony furnished with a chair and a round table.

You spend a few minutes unpacking, grateful for the quiet after the ferry and the busy harbor. Then you open the balcony door to let in some fresh air and step outside.

*continue hotel_wingull

*passage hotel_wingull
*title A Visitor on the Balcony
*hide_title

You've barely settled into the chair when a Wingull lands on the railing. It folds its long wings and looks around, apparently undisturbed by your presence. An empty water glass sits on the table beside you, and the little Pokémon soon notices it.

Wingull hops closer, peers into the glass, and taps the rim with its beak. Finding nothing inside, it turns its head toward you. It seems content to stay for the moment, although you can't tell whether it's curious about you or still hoping to find something to drink.

Your bracelet is within easy reach. You could look up Wingull in your Pokédex, or perhaps do something for your unexpected visitor.

*choice
#Look up Wingull and record the encounter -> hotel_scan_wingull
#Fill the glass with fresh water for Wingull -> hotel_wingull_water
#Leave Wingull alone and enjoy the view -> orientation_invitation

*passage hotel_scan_wingull
*title Looking Up Wingull
*hide_title
*journal scanned_wingull_hotel "You looked up Wingull after one landed on your hotel balcony."

You tap your bracelet and open the Pokédex. A small image of Wingull appears in the blue hologram, along with information about where it lives and how it uses coastal winds to travel. You glance between the entry and the real Pokémon, which has moved on to inspecting a flowerpot near the railing.

You save a note about seeing Wingull on your hotel balcony. Just as you close the display, it spreads its wings and glides down toward the courtyard, leaving you alone with the afternoon breeze.

*continue orientation_invitation

*passage hotel_wingull_water
*title A Drink for Your Visitor
*hide_title
*journal offered_wingull_water "You left fresh water for a Wingull visiting your balcony at the Portico Hotel."

You take the glass inside, rinse it, and fill it with fresh water. When you return, Wingull is still on the railing, watching the courtyard below. You set the glass on the table and move back to your chair, giving it room.

After a moment, Wingull approaches and dips its beak into the water. It drinks several times, then hops back onto the railing. A gust of wind lifts its feathers, and it takes off over the courtyard. You watch until it disappears beyond the roof of the next building.

*continue orientation_invitation

*passage food_route
*title The Salt and Thyme
*hide_title

There are plenty of places to eat along Lezano's waterfront, but the Salt and Thyme catches your attention. Its terrace overlooks the fishing boats, and a chalkboard beside the entrance lists tomato soup, warm bread, and grilled sandwiches. You order a bowl of soup with bread and take a table beneath a striped awning. With the harbor spread out in front of you, it seems a good place to spend part of the afternoon.

Before your food arrives, someone at the next table cries out. A Wattrel, a small yellow-and-black seabird Pokémon, has caught one foot in a length of cord hanging from the awning. It beats its wings in panic, winding the cord tighter. Above the nearby diners, a glass lantern swings from the same support, coming dangerously close to the edge of a table.

A young woman wearing a silver League bracelet steps forward as a customer reaches for Wattrel. "Don't grab its wings," she warns him. "You'll frighten it even more." She looks from the struggling bird to the lantern. "Someone needs to hold the frame steady. And we should get those people out of the way."

You have a moment to act. You could help make the terrace safe, or use your Pokédex to learn more about Wattrel before approaching it.

*choice
#Hold the awning support steady -> food_emergency [set restaurant_response "steady"]
#Help move the diners away from the lantern -> food_emergency [set restaurant_response "clear"]
#Look up Wattrel in your Pokédex first -> food_emergency [set restaurant_response "scan"]

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
You grip the nearest support with both hands while the server carefully unhooks the lantern and carries it away. The frame stops swaying, but Wattrel is still caught. The young woman studies the cord around its foot and asks whether there's a step stool nearby.

*show_if restaurant_response == "clear"
You guide the diners away from the swinging lantern. One man tries to collect his coat before moving, but you persuade him to leave it for now. With the table cleared, the young woman can catch hold of the awning support without anyone standing beneath it. Wattrel cries out again as the cord pulls tight.

*show_if restaurant_response == "scan"
You open the Pokédex above your wrist and search for Wattrel. The hologram identifies it as an Electric- and Flying-type Pokémon that lives near the coast, but before you can read much further, the lantern strikes the edge of a table and shatters. The server pulls a customer away from the falling glass and scratches her hand while moving a chair. Nobody is seriously hurt. The young woman catches the awning support and glances at your display. "We could use some help here," she says.

Wattrel is still tangled, its foot caught beneath two loops of cord. The woman thinks she can free it if someone helps her reach the knot and keeps the bird from thrashing. The server has gone inside to fetch supplies, and you spot a step stool near the café door and a stack of clean cloths on the service counter.

*choice
#Bring the step stool and steady it for her -> food_resolution [set restaurant_followup "stool"]
#Fetch a clean cloth to help calm Wattrel -> food_resolution [set restaurant_followup "cloth"]

*passage food_resolution
*title Freed at Last
*hide_title
*journal met_livia "You met Livia at the Salt and Thyme while helping free a tangled Wattrel."
*journal helped_wattrel "You helped free a Wattrel caught in the Salt and Thyme's awning."
*if livia_impression == "helpful"
  *journal livia_grateful "Livia was grateful you acted quickly during the Wattrel rescue."
*if livia_impression == "distracted"
  *journal livia_disappointed "Livia noticed you spent time on your Pokédex while the Wattrel needed help."

*show_if restaurant_followup == "stool"
You bring over the step stool and hold it firmly while the young woman climbs high enough to reach the cord. She works one loop free, waits for Wattrel to settle, then loosens the other. The Pokémon pulls its foot clear and scrambles onto the awning before taking flight over the harbor.

*show_if restaurant_followup == "cloth"
You bring a clean cloth and pass it to the young woman. The server steadies the frame while she gently shields Wattrel's eyes, taking care not to pin its wings. Its frantic movements slow enough for her to unwind the cord from its foot. Once free, Wattrel hops to the edge of the awning and flies out toward the fishing boats.

The young woman steps away from the awning and introduces herself as Livia. Like you, she's entered the League. The server thanks everyone who helped, then begins clearing the terrace and checking that no one else was hurt.

*show_if restaurant_response == "steady"
"Thanks for holding that support," Livia says. "I couldn't have reached the cord while it was shaking like that." She looks up at the empty awning, relieved to see Wattrel safely gone.

*show_if restaurant_response == "clear"
"I'm glad you got everyone out of the way," Livia says. "That lantern could have landed right on their table." She helps the server straighten a chair before sitting down.

*show_if restaurant_response == "scan"
Livia glances at your bracelet. "I understand wanting to know what you're dealing with, but that lantern nearly hit someone while you were reading." She pauses, then adds, "I'm glad you helped us get Wattrel free afterward."

*continue food_lunch

*passage food_lunch
*title A Table by the Water
*hide_title
*add credits -12

Once the terrace is back in order, the server brings the soup and bread you ordered. You pay twelve credits by tapping your bracelet against the payment terminal. Livia takes a seat nearby, and the two of you exchange a few words about the League while you eat. Before leaving, you have a chance to make a Pokédex note about the rescued Wattrel, if you want one.

*choice
#Save a Pokédex note about Wattrel -> food_scan_wattrel
#Finish your lunch and enjoy the waterfront -> orientation_invitation

*passage food_scan_wattrel
*title Looking Up Wattrel
*hide_title
*journal scanned_wattrel_rest "You looked up Wattrel after helping free one from the Salt and Thyme awning."

*show_if restaurant_response == "scan"
You reopen Wattrel's entry, which is still listed among your recent searches. This time, you have a chance to read it without worrying about the awning or the lantern.

*show_if restaurant_response != "scan"
You tap your bracelet and search for Wattrel. Its Pokédex entry appears above your wrist, with a small image and information about the species' coastal habitat.

You save a note about the Wattrel you helped free from the café awning. It's a more memorable first afternoon in Lezano than you'd expected. You close the display and finish your lunch.

*continue orientation_invitation

*passage orientation_invitation
*title Plans for the Afternoon
*hide_title

*show_if lucia_contact == true
As the afternoon wears on, your bracelet gives a soft chime. Lucia's name appears on the holographic display, and you answer her call. "Hi, ${trainer_name}! I made it through registration without getting lost," she says. "I was wondering if you'd like to walk to orientation together. We could meet by the fountain near the harbor at half past three. No pressure, of course. I just thought it'd be nice."

*show_if lucia_contact == false
You check the time on your bracelet. Orientation begins at four, and you still have a little while before you need to head uphill. The map shows a direct route to the Civic Forum and another through Lezano's smaller shopping streets.

You bring up the map and find the Civic Forum marked near the top of the hill. You could head straight there, or take the opportunity to see a little more of the city along the way.

*choice
#Meet Lucia by the harbor fountain -> orientation_with_lucia [if lucia_contact == true]
#Go directly to the Civic Forum -> orientation_alone
#Take the scenic route through the shopping streets -> orientation_scenic

*passage orientation_with_lucia
*title Meeting Lucia
*hide_title
*journal lucia_orientation_plans "You arranged to meet Lucia at the harbor fountain before orientation."

You agree to meet Lucia at half past three. When you reach the harbor fountain, she's waiting beside it in her orange jacket, studying the route on her bracelet. She looks up and waves as you approach. "There you are! I was starting to wonder whether I'd managed to pick the wrong fountain."

You head uphill together through streets decorated with red-and-gold League banners. Lucia points out a few shops she'd like to visit later and stops once to watch a pair of Pokémon playing in a shaded courtyard. She catches herself before you have to remind her of the time. "Right. Orientation first. Exploring afterward."

The Civic Forum comes into view at the top of the hill. Other contestants are gathering near its entrance, and you join them with a few minutes to spare.

*passage orientation_alone
*title Going on Your Own
*hide_title

*show_if lucia_contact == true
You tell Lucia you'd rather make your own way to the Civic Forum. "Of course," she says. "I'll look out for you when we get there." You end the call and check the route on your bracelet.

*show_if lucia_contact == false
You choose the direct route on your bracelet's map. It's a short walk from the waterfront, and you decide to save the shopping streets for another day.

The route takes you along a broad street climbing away from the harbor. Red-and-gold banners hang between the buildings, and you pass several other contestants following the same directions. Before long, the Civic Forum rises ahead, its entrance busy with people gathering for orientation.

*passage orientation_scenic
*title A Longer Walk
*hide_title

*show_if lucia_contact == true
You tell Lucia you'd like to look around the shopping streets before orientation. "Oh, that sounds nice," she says. "I'll see you at the Forum, then!" You end the call and bring up a longer route on your bracelet.

*show_if lucia_contact == false
You select the longer route on your bracelet's map, following it away from the waterfront and into Lezano's smaller streets.

You pass bookshops with baskets of used books outside, a bakery where a worker is arranging loaves in the window, and a flower stall nearly hidden beneath its own display of hanging plants. A few shopkeepers are putting up League decorations, and the streets grow busier as more contestants make their way uphill.

You keep an eye on the time as you wander. The Civic Forum is waiting at the top of the hill, and by the time you reach it, other contestants have already begun gathering near the entrance.
