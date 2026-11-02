*comment A complete private authoring demonstration, not in the public catalog.
*var name "alexander"
*var gold 5
*var reputation 20
*var plural_verbs true
*var pronouns_subject "they"
*var pronouns_object "them"
*var pronouns_possessive "their"
*var pronouns_possessive_pronoun "theirs"
*var pronouns_reflexive "themself"
*stat gold "Gold"
*skill diplomacy "Diplomacy"
*item letter "Letter"

*chapter The Audience
*passage creation
*title Choose Pronouns
Choose your pronouns. Gender and honorifics are independent of this choice.
*choice
#He / him -> he
*comment Choices stay flat.
#She / her -> she
#They / them -> they

*passage he
*title He / Him
*set pronouns_subject "he"
*set pronouns_object "him"
*set pronouns_possessive "his"
*set pronouns_possessive_pronoun "his"
*set pronouns_reflexive "himself"
*set plural_verbs false
Your selection is ready.
*continue audience

*passage she
*title She / Her
*set pronouns_subject "she"
*set pronouns_object "her"
*set pronouns_possessive "her"
*set pronouns_possessive_pronoun "hers"
*set pronouns_reflexive "herself"
*set plural_verbs false
Your selection is ready.
*continue audience

*passage they
*title They / Them
Your selection is ready.
*continue audience

*passage audience
*title The Royal Audience
*checkpoint
*temp can_enter false
*temp multiple_coins true
*if reputation >= 20 and not (gold < 1)
  *set can_enter true
  *if gold >= 5
    *grant_skill diplomacy
    *add_item letter 1
*elseif reputation >= 10
  *add gold 1
*else
  *add gold 2
*journal greeted "{They} @{plural_verbs are|is} welcomed as $!{name}."

The visitor is ${name}. [b]Welcome, [i]$!{name}[/i].[/b]
The document reads $!!{name}.

*if has_skill diplomacy
  The guards bow respectfully.
*elseif reputation >= 10
  The guards recognize your face.
*else
  The guards treat you as a stranger.

*page_break

The king reads the letter. {They} @{plural_verbs are|is} waiting.
You have ${gold} @{multiple_coins coins|coin}.

*page_break

He lowers the letter. Your response matters.

*choice
#Buy a sword (10 gold) -> purchase [selectable_if gold >= 10]
*if can_enter
  #Explain yourself -> explanation
#Leave quietly -> road
#Risk an insult -> fatal

*passage purchase
*title A Purchase
*remove_item letter 1
The deal is done.

*passage explanation
*title An Explanation
*temp remembered false
*set remembered true
You explain your visit.
*continue road

*passage road
*title The Road
The story ends here.

*passage fatal
*title A Fatal Insult
The king orders your execution.
*death
