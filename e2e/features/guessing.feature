Feature: Guessing the secret
  Apart from chatting, the player has a separate box for submitting the
  solution. The server compares the guess with the session's secret. A
  match wins the game and reveals the word. Each game allows three guesses,
  so the public word list can't simply be tried one by one.

  Background:
    Given the player has started a game

  Scenario: The solution box is separate from the chat box
    Then there is a solution box next to the message box
    And the solution button is disabled while the solution box is empty

  Scenario Outline: Submitting the right word wins
    When the player submits the session's secret <written as>
    Then the player wins
    And the secret is revealed

    Examples:
      | written as               |
      | exactly                  |
      | in uppercase             |
      | with spaces around it    |

  Scenario: A wrong guess keeps the game going
    Then the solution box shows 3 guesses left
    When the player submits the solution "wrongword"
    Then the keeper says that isn't it
    And the solution box shows 2 guesses left
    And the player can still send messages and guesses

  Scenario: Three wrong guesses lose the game, and the word stays secret
    When the player submits the solution "wrongone"
    And the player submits the solution "wrongtwo"
    And the player submits the solution "wrongthree"
    Then the player loses the game
    And the secret is not revealed
    And the message box is disabled
    And the solution box is disabled

  Scenario: The game ends after a win
    Given the player has won the game
    Then the message box is disabled
    And the solution box is disabled
