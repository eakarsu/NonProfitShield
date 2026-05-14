// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapProviderDirectoryPage() {
  return (
    <GapFeaturePage
      title="Provider Directory Integration"
      description="Provider Directory Integration"
      slug="provider-directory"
      aiResultKey="provider"
      fields={[
  {
    "name": "providerType",
    "label": "Provider Type",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "name",
    "label": "Name",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "npi",
    "label": "NPI / ID",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
