import * as cdk from 'aws-cdk-lib'
import * as budgets from 'aws-cdk-lib/aws-budgets'
import { Construct } from 'constructs'

interface MonitoringStackProps extends cdk.StackProps {
  /** Where cost alerts are emailed */
  alertEmail: string
  /** Monthly budget in USD */
  monthlyBudgetUsd: number
}

/**
 * A free monthly cost budget that emails as spending climbs. It notifies; it
 * doesn't block. See infra/README.md for the kill switch and the anomaly alert.
 */
export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props)

    const alert = (threshold: number, notificationType: 'ACTUAL' | 'FORECASTED') => ({
      notification: {
        comparisonOperator: 'GREATER_THAN',
        notificationType,
        threshold,
        thresholdType: 'PERCENTAGE',
      },
      subscribers: [{ subscriptionType: 'EMAIL', address: props.alertEmail }],
    })

    new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: 'rumpelstiltskin-monthly',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: props.monthlyBudgetUsd, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        alert(50, 'ACTUAL'),
        alert(80, 'ACTUAL'),
        alert(100, 'ACTUAL'),
        alert(100, 'FORECASTED'),
      ],
    })
  }
}
