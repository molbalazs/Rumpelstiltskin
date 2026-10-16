describe('Rumpelstiltskin App', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('renders the message input and send button', () => {
    cy.get('[data-testid="message-input"]').should('be.visible')
    cy.get('[data-testid="send-button"]').should('be.visible')
  })
})
