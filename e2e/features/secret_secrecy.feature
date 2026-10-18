@wip
Feature: The secret stays on the server
  The frontend never receives the secret until the player has won. Steps
  capture every API response the browser receives, read the real secret
  from the sessions table, and search for it.

  The keeper's reply text is the one exception. If the LLM itself gives the
  word away, that's the game working as intended.

  Scenario: Nothing sent to the browser contains the secret
    Given the player has started a game
    When the player sends the messages "Hello", "What are you guarding?" and "Is it a word?"
    And the player submits the solution "wrongword"
    Then no API response contains the session's secret, apart from the keeper's reply text
    And the page text doesn't contain the session's secret
    And neither localStorage nor sessionStorage contains the session's secret

  Scenario: The masked context gives nothing away
    When the player opens the app
    Then the context panel doesn't contain any 3-letter part of the session's secret
