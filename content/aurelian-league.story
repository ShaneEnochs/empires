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
*stat trainer_name "Trainer name"
*stat pronouns "Pronouns"
*pokemon starter_charmander "Charmander"
*pokemon starter_chikorita "Chikorita"
*pokemon starter_piplup "Piplup"

*chapter The Crossing

*passage ferry
*title Approaching Lezano

The ferry is crowded with prospective contestants. Beyond the rail, Lezano's coastal buildings rise around the harbor, their modern windows framed by pale columns and arches.

You are a young adult arriving in Torvesca for the inaugural Aurelian League. Like everyone aboard, you have left your existing Pokémon behind. Your new partnership will begin after arrival.

An announcement carries across the deck: “Welcome, contestants. Have your name ready when we dock.”

*continue name

*passage name
*title Your Name

You steady the registration form against the ferry rail. What name will you enter?

*input_text trainer_name "Trainer name" -> pronouns

*passage pronouns
*title Your Pronouns

Welcome, ${trainer_name}. Choose how the story refers to you.

*choice
#He / Him -> he
#She / Her -> she
#They / Them -> they

*passage he
*title Registration Ready
*set pronouns "He / Him"
*set pronouns_subject "he"
*set pronouns_object "him"
*set pronouns_possessive "his"
*set pronouns_possessive_pronoun "his"
*set pronouns_reflexive "himself"
*set use_plural_verbs false

Your form is ready, ${trainer_name}. Lezano is just ahead.

*continue arrival

*passage she
*title Registration Ready
*set pronouns "She / Her"
*set pronouns_subject "she"
*set pronouns_object "her"
*set pronouns_possessive "her"
*set pronouns_possessive_pronoun "hers"
*set pronouns_reflexive "herself"
*set use_plural_verbs false

Your form is ready, ${trainer_name}. Lezano is just ahead.

*continue arrival

*passage they
*title Registration Ready
*set pronouns "They / Them"
*set pronouns_subject "they"
*set pronouns_object "them"
*set pronouns_possessive "their"
*set pronouns_possessive_pronoun "theirs"
*set pronouns_reflexive "themself"
*set use_plural_verbs true

Your form is ready, ${trainer_name}. Lezano is just ahead.

*continue arrival

*chapter Lezano

*passage arrival
*title Arrival in Lezano
*checkpoint
*journal arrived "${trainer_name} arrived in Lezano. {They} @{use_plural_verbs are|is} ready for a new partnership."

The ferry eases into the harbor. You step onto the quay beneath an archway fitted with a bright digital welcome sign.

The Aurelian League is televised, but battling is not required to advance. Contestants can earn eight Laurels through courage, compassion, reasoning, cooperation, exploration, and other accomplishments.

The three highest-ranked contestants with all eight Laurels will qualify for the Triumvirate championship. For now, your first step is simpler: meet your new partner.

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

With ${starter_species} at your side, you leave the harbor ready to begin your journey in Torvesca.

Your Pokémon is listed in Party. This is the end of the current playable foundation.
