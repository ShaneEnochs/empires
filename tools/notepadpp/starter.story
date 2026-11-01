*var name "Traveller"
*var trust 0
*stat name "Name"
*stat trust "Trust"
*skill listening "Listening"
*item token "Ferry Token"

*chapter The Crossing
*passage arrival
*title At the Landing
*checkpoint
*add_item token 1

The ferryman waits beside a quiet river. Your name is ${name}.

*choice
#Listen to the ferryman -> conversation
#Cross without talking -> crossing

*passage conversation
*title A River Warning
*grant_skill listening
*add trust 1
*journal met_ferryman "The ferryman warned you about the current."

The ferryman describes a safe route between the rocks.

*continue crossing

*passage crossing
*title Across the River
*remove_item token 1

The ferry reaches the far bank.

*show_if has_skill listening
You recognize the safe channel from the ferryman's advice.

*choice
#Thank the ferryman -> thanks [if trust >= 1]
#Walk toward the village -> village

*passage thanks
*title A Parting Word

The ferryman waves goodbye.

*continue village

*chapter The Village
*passage village
*title A New Road
*checkpoint

A road leads onward. Your next adventure can begin here.
