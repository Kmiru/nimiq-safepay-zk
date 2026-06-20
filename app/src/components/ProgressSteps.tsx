type Step = 'review' | 'verify' | 'pay'

type ProgressStepsProps = {
  currentStep: Step
  reviewReady: boolean
  verified: boolean
  paid: boolean
}

const steps: { key: Step; label: string; number: string }[] = [
  { key: 'review', label: 'Review', number: '1' },
  { key: 'verify', label: 'Verify', number: '2' },
  { key: 'pay', label: 'Pay', number: '3' },
]

export function ProgressSteps({
  currentStep,
  reviewReady,
  verified,
  paid,
}: ProgressStepsProps) {
  function getStepState(step: Step): 'done' | 'active' | 'pending' {
    if (step === 'review' && reviewReady) return 'done'
    if (step === 'verify' && verified) return 'done'
    if (step === 'pay' && paid) return 'done'
    if (step === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className="progress-shell" aria-label="SafePay progress">
      {steps.map((step, index) => {
        const state = getStepState(step.key)
        const isLast = index === steps.length - 1

        return (
          <div key={step.key} className="progress-shell-item">
            <div className={`progress-pill ${state}`}>
              <span className="progress-pill-dot">
                {state === 'done' ? '✓' : step.number}
              </span>
              <span className="progress-pill-label">{step.label}</span>
            </div>

            {!isLast && (
              <div className={`progress-shell-line ${state === 'done' ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}