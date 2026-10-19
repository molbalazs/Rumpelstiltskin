Feature: Daily message limit
  Every chat message costs one LLM call. Before calling the LLM, the Lambda
  takes one from the global daily counter in DynamoDB. Once today's count
  reaches the cap, messages are refused and the LLM is not called.

  Steps seed today's counter directly in the rate-limit table.

  Background:
    Given the global daily cap is 5
    And the player has started a game

  Scenario: Messages are processed only while the counter allows
    Given today's message count is 4
    When the player sends the message "First"
    Then the keeper replies
    When the player sends the message "Second"
    Then the keeper says the daily limit has been reached
    And the message box is disabled
    And no LLM call is recorded for "Second"
    And today's message count is now 5

  Scenario: Starting a game and guessing don't use up the limit
    Given today's message count is 2
    When the player starts another game
    And the player submits the solution "wrongword"
    Then today's message count is now 2
