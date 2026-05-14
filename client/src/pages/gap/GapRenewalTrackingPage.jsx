// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapRenewalTrackingPage() {
  return (
    <GapFeaturePage
      title="Renewal/Lapse Tracking"
      description="Renewal/Lapse Tracking"
      slug="renewal-tracking"
      aiResultKey="reminder"
      fields={[
  {
    "name": "policyId",
    "label": "Policy ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "renewalDate",
    "label": "Renewal Date",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "reminderChannel",
    "label": "Reminder Channel",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
