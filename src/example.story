*var influence 0
*var honor 5
*var loyal false
*var character_name "Unknown"

*passage gate
*title The City Gate
*set character_name "Alexander"
*add influence 1

At dawn, you reach a city whose banners have outlasted its kings.

A messenger waits beside the open gate.
Beyond them, a bell calls the council to order.
Your name is ${character_name}. Your influence is ${influence}.

*choice
  #Speak to the messenger -> messenger
  #Go straight to the council -> council

*passage messenger
*title A Quiet Warning
*add influence 2
*add honor -1
*set loyal true

The messenger lowers their voice. 'The council needs a ruler. First, they need someone who will listen.'

They step aside, leaving the road to the council hall clear.
Your influence is ${influence}, and your loyalty is ${loyal}.

*continue council

*passage council
*title The Empty Chair
*add influence -0.5

Inside the council hall, an empty chair stands at the head of the table.

Every voice falls silent as you enter. Your story is only beginning.
Influence: ${influence}. Honor: ${honor}. Loyal: ${loyal}.
