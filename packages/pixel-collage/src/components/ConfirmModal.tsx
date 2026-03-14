interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div
            data-testid="confirm-modal"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-pink-900/35 p-4"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                className="w-full max-w-md rounded-xl border-4 border-pink-300 bg-pink-50 p-4 shadow-2xl"
            >
                <h2 id="confirm-modal-title" className="text-sm text-pink-700">
                    {title}
                </h2>
                <p className="mt-2 text-xs text-pink-600">{message}</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded bg-pink-200 px-3 py-1 text-[11px] text-pink-700 hover:bg-pink-300 transition-colors cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded bg-rose-500 px-3 py-1 text-[11px] text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
