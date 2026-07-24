import { getSignaturesForItem } from "@/lib/server/repository/signatures";
import { ItemStatus, SignatureMeaning, UserRole } from "@/generated/prisma/enums";
import type { ItemType } from "@/generated/prisma/enums";
import { SignForm } from "./sign-form";
import { signOnlyAction, signTransitionAction } from "./sign-actions";

const SIGNER_ROLES: UserRole[] = [UserRole.APPROVER, UserRole.QA, UserRole.ADMIN];

export async function SignaturesSection({
  slug,
  traceItemId,
  itemType,
  status,
  viewerRole,
}: {
  slug: string;
  traceItemId: string;
  itemType: ItemType;
  status: ItemStatus;
  viewerRole: UserRole;
}) {
  const signatures = await getSignaturesForItem(itemType, traceItemId);
  const canSign = SIGNER_ROLES.includes(viewerRole);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Signatures & Approval
      </h2>

      {canSign && (
        <div className="flex flex-col gap-2">
          {(status === ItemStatus.DRAFT || status === ItemStatus.IN_REVIEW) && (
            <>
              <SignForm
                action={signTransitionAction.bind(
                  null,
                  slug,
                  traceItemId,
                  ItemStatus.APPROVED,
                  SignatureMeaning.APPROVED
                )}
                label="Approve this record"
                confirmLabel="Sign & Approve"
              />
              <SignForm
                action={signTransitionAction.bind(
                  null,
                  slug,
                  traceItemId,
                  ItemStatus.REJECTED,
                  SignatureMeaning.REJECTED
                )}
                label="Reject this record"
                confirmLabel="Sign & Reject"
                buttonClassName="self-start rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              />
            </>
          )}
          {status === ItemStatus.APPROVED && (
            <SignForm
              action={signTransitionAction.bind(
                null,
                slug,
                traceItemId,
                ItemStatus.EFFECTIVE,
                SignatureMeaning.APPROVED
              )}
              label="Mark this record effective"
              confirmLabel="Sign & Mark Effective"
            />
          )}
          <SignForm
            action={signOnlyAction.bind(null, slug, traceItemId, SignatureMeaning.REVIEWED)}
            label="Sign as reviewed (doesn't change status)"
            confirmLabel="Sign as Reviewed"
            buttonClassName="self-start rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
          />
        </div>
      )}
      {!canSign && (
        <p className="text-sm text-neutral-500">
          Only Approvers, QA, and Admins can sign records.
        </p>
      )}

      {signatures.length === 0 ? (
        <p className="text-sm text-neutral-500">No signatures yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {signatures.map((sig) => (
            <li
              key={sig.id}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <p>
                <span className="font-medium">{sig.signer.fullName}</span> signed version{" "}
                {sig.versionNumber ?? "?"} as{" "}
                <span className="font-medium">{sig.meaning}</span>
              </p>
              <p className="text-xs text-neutral-500">
                {sig.signedAt.toLocaleString()} · hash {sig.contentHash.slice(0, 12)}…
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
