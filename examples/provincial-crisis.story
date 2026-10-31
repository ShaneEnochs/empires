*var envoy_name "Mara Vale"
*var authority 2
*var trust 0
*var plan "Undecided"
*var workers_fed false
*var river_warning false
*var bonded false
*stat envoy_name "Envoy"
*stat authority "Authority"
*stat trust "Public trust"
*stat plan "Settlement"
*skill commission "Provincial Commission"
*skill channel_knowledge "Channel Knowledge"
*skill diplomacy "Diplomacy"
*item coin "Dispatch Coin"
*item sealed_writ "Emergency Writ"
*item grain_sack "Grain Sack"
*item ledger_copy "Attested Grain Accounts"

*chapter The Writ

*passage quayside
*title The Last Ferry
*grant_skill commission
*add_item coin 4
*add_item sealed_writ 1
*journal arrival "The last ferry reached Bellwether before the river closed."

The last ferry leaves you in Bellwether with four dispatch coins and an emergency writ. Rain has cut the provincial road. Six sacks of public grain wait in the customs shed; the lower town says the governor has sold the rest to merchants.

Your commission lets you requisition supplies until sunset. After that, any settlement must stand on evidence, consent, or the guard's willingness to enforce it. The river will not wait for an appeal to the capital.

*choice
  #Enter a different name in the public record -> choose_name
  #Keep the name Mara Vale and begin -> background

*passage choose_name
*title The Public Record

The ferryman opens the dispatch register. He asks which name the town should hold responsible for the decisions ahead.

*input_text envoy_name "Name for the public record" -> background

*passage background
*title What You Bring

Your writ says ${envoy_name}. It does not say why anyone here should trust you. Before the commission, you made a living in one of two worlds.

*choice
  #You surveyed these river channels -> river_background
  #You mediated disputes at the provincial court -> clerk_background

*passage river_background
*title Old Watermarks
*grant_skill channel_knowledge
*add trust 1
*journal river_background "${envoy_name} returned as a former river surveyor."

The quay workers remember you carrying a sounding pole before you carried a seal. Their welcome is cautious, but real. You know the channels and the old sluice machinery; you will still need fresh watermarks before taking boats through a rising river.

*continue briefing

*passage clerk_background
*title A Clerk's Reputation
*grant_skill diplomacy
*add authority 1
*journal clerk_background "${envoy_name} brought the negotiating habits of the provincial court."

The town clerk recognizes your handwriting on a past arbitration. Officials will listen before they dismiss you, and you know how to turn an accusation into a signed undertaking. The quay workers reserve their judgment.

*continue briefing

*passage briefing
*title Six Sacks and a Day
*checkpoint
*add authority 1
*add_item grain_sack 6
*journal mandate_briefed "${envoy_name} accepted six public grain sacks with authority ${authority}."

The customs keeper signs six sacks into your charge. They are not an abstract treasury: every sack you commit here will be missing from another queue. A reserve boat is expected by evening, if the upper landing holds.

You can investigate the mill accounts, hear the families outside the depot, or use the writ to compel a private cart. You may also take the public reserve directly to the night council. Each visit costs daylight; you can complete one field circuit before the meeting.

*show_if has_skill commission
The keeper will honor a requisition while your commission lasts.

*choice
  #Investigate the mill accounts -> mill_yard
  #Visit the families outside the depot -> depot_queue
  #Requisition the merchant's waiting cart -> cart_seizure [if has_skill commission]
  #Bypass fieldwork and convene the council -> night_council

*chapter The River

*passage mill_yard
*title The Mill Yard

The mill wheels stand still, but the warehouse doors are dry. A junior clerk admits that grain has moved under private seals while the public ration book shows an empty store.

He fears losing his post. For two dispatch coins he will certify a copy of the accounts. An experienced negotiator might persuade him to testify without payment.

*choice
  #Pay two coins for attested accounts -> copied_records [if item_count coin >= 2]
  #Negotiate a protected statement -> sworn_testimony [if has_skill diplomacy]
  #Leave the clerk in peace and inspect the levee -> levee_path

*passage copied_records
*title Ink Paid For
*remove_item coin 2
*add_item ledger_copy 1
*add authority 1
*journal copied_records "${envoy_name} paid two coins for attested grain accounts."

The clerk copies the private deliveries and stamps each page. You have spent half your dispatch money, but the figures can survive a hostile hearing. You promise that his name will appear as a witness, not as the author of the diversion.

*continue levee_path

*passage sworn_testimony
*title A Witness, Not an Informer
*add_item ledger_copy 1
*add trust 1
*journal sworn_testimony "The mill clerk signed protected testimony for ${envoy_name}."

You offer the clerk a public summons instead of a secret bargain. He can explain the books before the whole council, with his superior beside him. He signs the relevant accounts and asks you to keep that promise.

The warehouse porters see him leave openly. Word of the undertaking reaches the quay before you do.

*continue levee_path

*passage levee_path
*title The Unshored Gate

At the old sluice, a carpenter has chalked a warning across the chamber door. Its shore timbers have shifted. Entering the chamber could free the gate, but a failed support would leave nobody time to pull you out.

Fresh watermarks would show which channel remains usable tonight. A surveyor can read them from the bank. Otherwise, a pilot offers to take soundings for one coin. The dry road to the council remains open.

*show_if has_skill channel_knowledge
You recognize the old channel marks, but yesterday's depths are no guarantee of tonight's water.

*choice
  #Read the new watermarks from the bank -> flood_survey [if has_skill channel_knowledge]
  #Pay one coin for a pilot's soundings -> hired_pilot [if item_count coin >= 1]
  #Enter the unshored sluice chamber despite the warning -> sluice_death
  #Take the dry road without fresh soundings -> night_council

*passage flood_survey
*title The High-Water Line
*set river_warning true
*add trust 1
*journal flood_survey "${envoy_name} marked a safe channel above the failing sluice."

The newest silt line is a hand above the morning mark. You show the boat crews a channel that will carry loaded ferries without opening the damaged gate. They repeat the bearings back to you before you leave.

That confidence belongs to the crews as much as to you. At the council, their willingness to act will matter.

*continue night_council

*passage hired_pilot
*title Local Soundings
*remove_item coin 1
*grant_skill channel_knowledge
*set river_warning true
*add trust 1
*journal hired_pilot "${envoy_name} paid a pilot one coin and learned the safe channel."

The pilot earns the coin by making you repeat every bearing. You can now direct a crew through the marked channel, and you have the current soundings to justify doing so.

He will tell the quay workers that the commission paid for knowledge instead of gambling with their boats.

*continue night_council

*passage depot_queue
*title Outside the Locked Depot
*journal depot_queue "The depot families asked for food before any settlement."

Families wait under sailcloth outside the depot. They ask for two sacks from the public reserve now, before anyone bargains over the remainder. A nearby merchant offers another answer: a bonded advance of grain, secured against the next harvest.

You can hear his terms and return to this queue before deciding. The families will not be fed merely because their request has been recorded.

*choice
  #Issue two sacks to the relief kitchen -> relief_kitchen [if item_count grain_sack >= 2]
  #Hear the merchant's terms -> bonded_offer
  #Keep the reserve intact and go to council -> night_council

*passage relief_kitchen
*title The Kitchen Opens
*remove_item grain_sack 2
*add trust 2
*add authority -1
*set workers_fed true
*journal relief_kitchen "${envoy_name} released two sacks before receiving the governor's permission."

The kitchen puts two sacks into its boilers. The families offer to send delegates to the council and help unload whatever comes next. You have gained their support by spending food, not by promising it twice.

The governor's secretary records the release as unauthorized. His objection will weaken your official standing even if the town respects the decision.

*continue night_council

*passage bonded_offer
*title Grain Against the Harvest

The merchant will advance three sacks for three dispatch coins and a provincial guarantee against next year's harvest. The town gets more food tonight; his firm gets first claim on the harvest before local debts are settled.

No contract exists until you accept. You may return to the families without spending anything.

*choice
  #Accept the bonded advance for three coins -> merchant_bond [if item_count coin >= 3]
  #Decline and return to the queue -> depot_queue

*passage merchant_bond
*title A Signature Carried Forward
*remove_item coin 3
*add_item grain_sack 3
*add authority 1
*add trust -1
*set bonded true
*journal merchant_bond "${envoy_name} pledged the next harvest for three additional grain sacks."

The merchant's carters join your convoy. Officials welcome an advance that keeps the provincial accounts solvent. The families read the harvest guarantee and grow quieter.

The sacks are real, and so is the obligation. Neither a generous speech nor a later evacuation will erase the signature.

*continue night_council

*passage cart_seizure
*title The Writ Used
*add_item grain_sack 2
*add authority 2
*add trust -2
*journal cart_seizure "${envoy_name} requisitioned two sacks from a private cart."

The keeper reads your seal and transfers two sacks from the waiting cart into the reserve. His obedience strengthens your standing with the officials.

The carter says the shipment was meant for an upriver village. Your writ does not answer him. People in the queue notice how easily an emergency can move hunger out of sight.

*continue night_council

*passage sluice_death
*title Beneath the Shore Timbers
*remove_item grain_sack 1
*journal sluice_loss "${envoy_name} was lost beneath the unshored sluice."

A support slips as you step into the chamber. A grain sack carried for ballast vanishes with the platform. The carpenter reaches the bank, but the collapsing gate cuts off your return.

The river takes the commission's bearer before the council can meet.

*death

*chapter Night Council

*passage night_council
*title When the Seal Expires
*checkpoint
*add_item grain_sack 2
*remove_item sealed_writ 1
*revoke_skill commission
*journal council_open "${envoy_name} opened the night council with ${authority} authority and ${trust} public trust."

The reserve boat arrives with two more sacks. Then the customs keeper breaks the wax on your writ and files it. The emergency commission has expired; you cannot requisition another cart.

Officials, workers, boat crews, and merchants crowd the room. The lower streets must be supplied or cleared tonight. What can you ask these people to accept?

*show_if lacks_skill commission
Your seal can no longer turn an instruction into law. Every promise now needs willing hands or armed enforcement.

*show_if bonded == true
The merchant lays your harvest guarantee beside the public accounts.

*choice
  #Present the attested grain accounts -> evidence_hearing [if has_item ledger_copy]
  #Invite the kitchen delegates to propose a settlement -> popular_assembly [if workers_fed == true]
  #Ask the guard to take charge of distribution -> guard_offer [if authority >= 4]
  #Plan an evacuation of the lower town -> evacuation_plan

*passage evidence_hearing
*title Accounts Read Aloud
*add authority 1
*journal evidence_heard "The council heard ${envoy_name}'s attested accounts."

The clerk reads the deliveries aloud. The governor cannot explain why public grain traveled under private seals, but a scandal alone will not move tonight's sacks.

You need either negotiating skill or enough public confidence to turn the hearing into a working agreement. The guard remains an option if you are prepared to accept its terms.

*choice
  #Negotiate a supervised civic compact -> ending_compact [if has_skill diplomacy]
  #Let trusted local delegates carry the compact -> ending_compact [if trust >= 2]
  #Hand the distribution problem to the guard -> guard_offer [if authority >= 4]
  #Set the hearing aside and evacuate -> evacuation_plan

*passage popular_assembly
*title Seats for the Kitchen
*add trust 1
*journal popular_assembly "The kitchen delegates joined ${envoy_name} at the council table."

The delegates arrive with an empty boiler and a list of households. Feeding people before the meeting has made your next promise believable.

They propose committing six sacks to public kitchens and publishing each day's allocations. Six sacks cover tonight's households; promises beyond that must wait for an open count of the stores.

*choice
  #Commit six sacks to the civic compact -> ending_compact [if item_count grain_sack >= 6]
  #Use the remaining food to support evacuation -> evacuation_plan

*passage ending_compact
*title A Table With More Seats
*remove_item grain_sack 6
*add trust 2
*set plan "Civic compact"
*journal ending_compact "${envoy_name} secured a civic compact and committed six sacks to public kitchens."

By dawn, the kitchens answer to a board chosen in the crowded council room. Six sacks have left your reserve under a public tally. You have not repaired the levee or ended provincial hunger, but no private seal can now hide tonight's distribution.

The board writes ${envoy_name} into the agreement as its guarantor. Its next argument will happen across a table, with the accounts open.

*show_if has_item ledger_copy
The attested accounts are sent upriver for an inquiry into the governor's diversions.

*show_if lacks_item ledger_copy
Without attested accounts, the governor keeps his office. The settlement limits his discretion rather than proving a criminal charge.

*show_if workers_fed == true
The first kitchen's delegates keep their seats; relief has become a claim to representation.

*passage guard_offer
*title The Captain's Conditions
*add trust -1
*journal guard_requested "${envoy_name} asked the captain to control the ration lines."

The captain offers an enforceable ration schedule. In return, the guard will control the depot gates and decide who enters a queue. Asking him has already alarmed the delegates outside.

You may accept an orderly distribution with unequal access, or turn him down and spend your remaining resources on getting people away from the river.

*choice
  #Accept guard-controlled rationing -> ending_guard
  #Reject the conditions and arrange evacuation -> evacuation_plan

*passage ending_guard
*title An Order Posted at Dawn
*remove_item grain_sack 4
*add trust -2
*set plan "Guard rationing"
*journal ending_guard "${envoy_name} placed four grain sacks under guard-controlled rationing."

The captain posts your ration order before dawn. Four sacks go behind the depot gates, where armed clerks admit the households on an official list. There is food, and the lower town does not rise tonight.

Those left outside know which name appears beneath the order: ${envoy_name}. You have preserved a working provincial authority while narrowing the number of people who can demand an answer from it.

*show_if bonded == true
The merchant's guarantee becomes a preferred claim in the captain's ration schedule.

*passage evacuation_plan
*title Boats Before Possessions

The lower streets can be cleared, but the crews need payment or provisions. Three coins will hire experienced ferry hands. Four grain sacks will secure the merchants' broad barges; two more will feed people at the receiving camp.

If you know the channels, you can direct smaller boats without paying a fare, provided you obtained current soundings. The damaged sluice is still a dangerous shortcut. The keeper counts the food beside the door: you can cover the barge crews and the camp, though doing so will leave less for tomorrow.

*show_if river_warning == true
You can show the crews the safe bearings recorded before the council.

*show_if river_warning == false
You have no current soundings. An old map alone is not enough to open a channel tonight.

*choice
  #Hire the ferry hands for three coins -> paid_ferries [if item_count coin >= 3]
  #Prepare the channel you know -> guided_evacuation [if has_skill channel_knowledge]
  #Trade four sacks for broad barges -> grain_barges
  #Force the damaged sluice as a shortcut despite the risk -> night_breach

*passage paid_ferries
*title Hands Who Know Tonight's Water
*remove_item coin 3
*grant_skill channel_knowledge
*set river_warning true
*journal paid_ferries "${envoy_name} hired local ferry hands for three coins."

The crews take your three coins and send a sounding boat ahead. They show you the course before loading families into the ferries. You keep the grain reserve for the camp rather than spending it on passage.

*continue ending_refuge

*passage guided_evacuation
*title Knowledge Put to Work
*journal guided_evacuation "${envoy_name} prepared to direct the smaller evacuation boats."

The crews understand your bearings. Before they load the first family, the pilot asks when those bearings were checked. Local knowledge opens this conversation; current soundings decide whether the boats should enter the channel.

*show_if river_warning == true
Your fresh watermarks answer him. There is no need to touch the failing sluice.

*show_if river_warning == false
You cannot answer with today's depths. He offers the broad barges instead, at the stated grain price.

*choice
  #Use the freshly checked channel -> ending_refuge [if river_warning == true]
  #Trade four sacks for the broad barges instead -> grain_barges
  #Order the damaged sluice opened without a safe course -> night_breach

*passage grain_barges
*title Food as Passage
*remove_item grain_sack 4
*add trust 1
*journal grain_barges "${envoy_name} committed four sacks to the barge crews."

The crews accept four sacks as provisions and payment, then lash their broad barges together. You have preserved your coins at the cost of food that might have lasted through another day.

Two of the remaining sacks are reserved for the camp. Families board knowing both what has been saved and what it has cost.

*continue ending_refuge

*passage ending_refuge
*title A Town Above the Water
*remove_item grain_sack 2
*add trust 1
*set plan "River refuge"
*journal ending_refuge "${envoy_name} fed the receiving camp with two sacks after evacuating the lower town."

The last boat reaches the high ground before dawn. Two sacks go into the camp kitchens. The lower town's ledgers, workshops, and houses remain behind, but the families are out of the water's path.

The governor retains the depot. You chose lives over a settlement of the grain dispute, and ${envoy_name} must now argue for shelter and work for a town without its streets.

*show_if bonded == true
The harvest guarantee follows the evacuees to the camp. Rescue has not canceled their future debt.

*show_if has_item ledger_copy
You keep the attested accounts dry. The argument over the stores can still be made when the boats return.

*passage night_breach
*title The Gate Gives Way
*remove_item grain_sack 1
*journal night_breach "${envoy_name} was lost attempting the damaged sluice after the council."

Under the night's higher water, the damaged gate tears free. A boat rolls against the wall and spills a sack into the current. The crews get back to the bank, but they cannot reach you.

The meeting has ended. The river has not.

*death
