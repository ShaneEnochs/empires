*var influence 0
*skill diplomacy "Diplomacy"
*item gold_coin "Gold Coin"
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
*title The City Gate
*set character_name "Alexander"
*add influence 1
*grant_skill composure
*add_item gold_coin 10
*add_item gate_token 1
*journal arrived_city "${character_name} reached the city with influence ${influence}."

At dawn, you reach a city whose banners have outlasted its kings.
The guard issues a gate token to carry to the council.

A messenger waits beside the open gate.
Beyond them, a bell calls the council to order.
Your name is ${character_name}. Your influence is ${influence}.

*choice
  #Speak to the messenger -> messenger
  #Go straight to the council -> council
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

The messenger lowers their voice. 'The council needs a ruler. First, they need someone who will listen.'
They press two gold coins into your palm.

They step aside, leaving the road to the council hall clear.
Your influence is ${influence}, and your loyalty is ${loyal}.

*continue council

*chapter Chapter One

*passage council
*title The Empty Chair
*add influence -0.5
*revoke_skill composure
*remove_item gold_coin 5
*remove_item gate_token 1
*journal met_council "You reached the council with influence ${influence}."

Inside the council hall, an empty chair stands at the head of the table.
The clerk collects your gate token and the five-coin entry fee.

Every voice falls silent as you enter. Your story is only beginning.
Influence: ${influence}. Honor: ${honor}. Loyal: ${loyal}.

*show_if has_skill diplomacy
Your diplomatic training helps you choose your words.

*show_if lacks_skill diplomacy
Without diplomatic training, you face the council unaided.

*show_if has_item gold_coin
The coins remaining in your purse offer a small reassurance.

*show_if item_count gold_coin >= 7
The messenger's extra coins remain after the entry fee.

*chapter Prologue

*passage choose_name
*title Choose Your Name

Before entering the council, choose the name you wish to use at court.

*input_text character_name "Preferred name" -> choose_background

*passage choose_background
*title Choose Your Background
*checkpoint
*journal chose_name "You introduced yourself as ${character_name}."

Welcome, ${character_name}. What shaped your life before this journey?

*choice
  #Raised among nobility -> noble_origin
  #Trained with soldiers -> soldier_origin
  #Explore the abandoned watchtower -> watchtower

*passage noble_origin
*title A Noble Upbringing
*add influence 2
*grant_skill diplomacy
*journal noble_origin "${character_name} learned the customs of the royal court."

You learned to navigate the customs of the royal court.

*continue council

*passage soldier_origin
*title A Soldier's Training
*add honor 2
*set loyal true
*journal soldier_origin "${character_name} trained with soldiers and swore an oath of loyalty."

Discipline and loyalty shaped your years of training.

*continue council

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
