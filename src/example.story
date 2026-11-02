*var influence 0
*skill diplomacy "Diplomacy"
*item gold_coin "Supply Token"
*var honor 5
*var loyal false
*var character_name "Unknown"
*skill composure "Composure"
*item gate_token "Gate Token"
*stat character_name "Name"
*stat influence "Influence"
*stat honor "Honor"
*stat loyal "Loyal"

*chapter Prologue

*passage gate
*title The Pokémon Center
*set character_name "Alexander"
*add influence 1
*grant_skill composure
*add_item gold_coin 10
*add_item gate_token 1
*journal arrived_city "${character_name} reached the city with influence ${influence}."

At dawn, you reach the Pokémon Center for a private training exercise.
The guard issues a gate token to carry to the center.

A messenger waits beside the open gate.
Beyond them, a bell calls the center to order.
Your name is ${character_name}. Your influence is ${influence}.

*choice
  #Speak to the messenger -> messenger
  #Go straight to the center -> center
  #Choose a preferred name and background -> choose_name
  #Explore the abandoned watchtower -> watchtower

*passage messenger
*title A Quiet Warning
*add influence 2
*add honor -1
*set loyal true
*grant_skill diplomacy
*add_item gold_coin 2
*journal met_messenger "The messenger accepted your oath. Influence: ${influence}."

The messenger lowers their voice. 'The Pokémon care team needs help. First, they need someone who will listen.'
They press two supply tokens into your palm.

They step aside, leaving the road to the center hall clear.
Your influence is ${influence}, and your loyalty is ${loyal}.

*continue center

*chapter Chapter One

*passage center
*title The Empty Chair
*add influence -0.5
*revoke_skill composure
*remove_item gold_coin 5
*remove_item gate_token 1
*journal met_center "You reached the center with influence ${influence}."

Inside the center hall, an empty chair stands at the head of the table.
The clerk collects your gate token and the five-coin entry fee.

Every voice falls silent as you enter. Your story is only beginning.
Influence: ${influence}. Honor: ${honor}. Loyal: ${loyal}.

*show_if has_skill diplomacy
Your diplomatic training helps you choose your words.

*show_if lacks_skill diplomacy
Without diplomatic training, you face the center unaided.

*show_if has_item gold_coin
The coins remaining in your purse offer a small reassurance.

*show_if item_count gold_coin >= 7
The messenger's extra coins remain after the entry fee.

*chapter Prologue

*passage choose_name
*title Choose Your Name

Before entering the center, choose the name you wish to use at the Pokémon Center.

*input_text character_name "Preferred name" -> choose_background

*passage choose_background
*title Choose Your Practice Route
*checkpoint
*journal chose_name "You introduced yourself as ${character_name}."

Welcome, ${character_name}. What shaped your life before this journey?

*choice
  #Raised among Pokémon carers -> carer_origin
  #Trained with field researchers -> researcher_origin
  #Explore the abandoned watchtower -> watchtower

*passage carer_origin
*title A Care Workshop
*add influence 2
*grant_skill diplomacy
*journal carer_origin "${character_name} learned the routines of the Pokémon care team."

You learned to navigate the routines of the Pokémon care team.

*continue center

*passage researcher_origin
*title Field Research
*add honor 2
*set loyal true
*journal researcher_origin "${character_name} trained with field researchers and swore an oath of loyalty."

Discipline and loyalty shaped your years of training.

*continue center

*passage watchtower
*title The Abandoned Watchtower
*add influence 1
*revoke_skill composure
*grant_skill diplomacy
*add_item gold_coin 1
*journal entered_watchtower "You explored the abandoned watchtower."

You climb a broken stair in search of a view of the city.

*continue fatal_fall

*passage fatal_fall
*title A Fatal Fall

The stair collapses beneath you. Your journey ends in the silent tower.

*death
