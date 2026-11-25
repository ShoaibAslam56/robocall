import { useDemoToast } from "../../hooks/useDemoToast";
import type { Campaign } from "../../types/robocall";
import { formatNumber } from "../../utils/format";

interface DashboardTilesProps {
  storeName: string;
  isThankYouNoticeOn: boolean;
  runningCampaign: Campaign | null;
  voiceName: string;
}

// Bottom row of the Dashboard: one recommended feature, one live item, one
// tip. Same tile row as the bottom of the Loyalty app's Home.
export function DashboardTiles({
  storeName,
  isThankYouNoticeOn,
  runningCampaign,
  voiceName,
}: DashboardTilesProps) {
  const showDemoToast = useDemoToast();

  return (
    <div className="pk-grid pk-grid--3">
      <div
        className={`pk-tile${isThankYouNoticeOn ? "" : " pk-tile--feature"}`}
      >
        <div className="pk-row pk-row--between">
          <span className="pk-icon-tile" aria-hidden="true">
            <s-icon type="receipt" />
          </span>
          {isThankYouNoticeOn ? (
            <s-badge tone="success">On</s-badge>
          ) : (
            <s-badge tone="info">Recommended</s-badge>
          )}
        </div>
        <div className="pk-tile__title">Tell customers to expect your call</div>
        <p className="pk-tile__body">
          {`Show “${storeName} will call you in a few minutes to confirm. Press 1 to confirm.” on the Thank you page. Fewer people ignore an unknown number.`}
        </p>
        <div className="pk-tile__foot">
          <s-button
            variant={isThankYouNoticeOn ? "secondary" : "primary"}
            onClick={() =>
              showDemoToast(
                "add it in Settings → Checkout → Customize → Thank you page → Add app block → Pakka call notice",
              )
            }
          >
            {isThankYouNoticeOn ? "Edit message" : "Add to Thank you page"}
          </s-button>
        </div>
      </div>

      <div className="pk-tile">
        <span className="pk-icon-tile pk-icon-tile--muted" aria-hidden="true">
          <s-icon type="megaphone" />
        </span>
        {runningCampaign ? (
          <>
            <div className="pk-tile__title">{`“${runningCampaign.name}” is running`}</div>
            <p className="pk-tile__body">
              {`${formatNumber(runningCampaign.stats.placed)} of ${formatNumber(runningCampaign.audience.size)} customers called, ${formatNumber(runningCampaign.stats.interested)} interested so far.`}
            </p>
            <div className="pk-tile__foot">
              <s-button href="/app/campaigns">View campaigns</s-button>
            </div>
          </>
        ) : (
          <>
            <div className="pk-tile__title">
              Bring customers back with a campaign
            </div>
            <p className="pk-tile__body">
              Call past customers about a sale or a restock. They press 1 if
              they&apos;re interested.
            </p>
            <div className="pk-tile__foot">
              <s-button href="/app/campaigns/new">Create campaign</s-button>
            </div>
          </>
        )}
      </div>

      <div className="pk-tile">
        <span className="pk-icon-tile pk-icon-tile--muted" aria-hidden="true">
          <s-icon type="microphone" />
        </span>
        <div className="pk-tile__title">{`Customers hear: ${voiceName}`}</div>
        <p className="pk-tile__body">
          A recording with your store name sounds familiar, so more people stay
          on the line long enough to press 1.
        </p>
        <div className="pk-tile__foot">
          <s-button href="/app/settings/calling">Change voice</s-button>
        </div>
      </div>
    </div>
  );
}
