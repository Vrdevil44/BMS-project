import React, { useEffect, useRef, useState } from 'react';
import Dialog, { DialogVariant } from './Dialog';
import { EntryValues, FieldErrors, validateEntry } from '../lib/validation';

const EMPTY: EntryValues = { name: '', companyname: '', email: '', phone: '', address: '' };
const INPUT = 'w-full p-2 border rounded text-gray-700';

const FIELDS: { name: keyof EntryValues; label: string; type: string; autoComplete: string; required?: boolean }[] = [
    { name: 'name', label: 'Name', type: 'text', autoComplete: 'off', required: true },
    { name: 'companyname', label: 'Company Name', type: 'text', autoComplete: 'off' },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'off', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'off' },
    { name: 'address', label: 'Address', type: 'text', autoComplete: 'off' },
];

interface EntryDialogProps {
    variant: DialogVariant;
    title: string;
    /** Singular noun for messages, e.g. "customer". */
    noun: string;
    initialData: (EntryValues & { id: string }) | null;
    onClose: () => void;
    /** Throw to surface an error inside the dialog. */
    onSave: (values: EntryValues) => Promise<void>;
    onDelete: () => Promise<void>;
    /** Invoice dialog only: look up a customer by UUID to prefill the form. */
    lookupCustomer?: (uuid: string) => Promise<EntryValues | null>;
}

const ErrorText: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
    <p id={id} className="mt-1 text-sm text-red-700 bg-red-50 rounded px-2 py-1">{children}</p>
);

const EntryDialog: React.FC<EntryDialogProps> = ({ variant, title, noun, initialData, onClose, onSave, onDelete, lookupCustomer }) => {
    const isEdit = !!initialData;
    const [values, setValues] = useState<EntryValues>(
        initialData
            ? { name: initialData.name, companyname: initialData.companyname, email: initialData.email, phone: initialData.phone, address: initialData.address }
            : EMPTY,
    );
    const [errors, setErrors] = useState<FieldErrors<keyof EntryValues>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [lookupUuid, setLookupUuid] = useState('');
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupBusy, setLookupBusy] = useState(false);
    const keepRef = useRef<HTMLButtonElement>(null);
    const mounted = useRef(true);

    useEffect(() => () => { mounted.current = false; }, []);
    useEffect(() => {
        if (confirmingDelete) keepRef.current?.focus();
    }, [confirmingDelete]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setValues((v) => ({ ...v, [name]: value }));
        setErrors((er) => ({ ...er, [name]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const found = validateEntry(values);
        setErrors(found);
        setFormError(null);
        const firstBad = FIELDS.find((f) => found[f.name]);
        if (firstBad) {
            e.currentTarget.querySelector<HTMLElement>(`[name="${firstBad.name}"]`)?.focus();
            return;
        }
        setBusy(true);
        try {
            await onSave({
                name: values.name.trim(),
                companyname: values.companyname.trim(),
                email: values.email.trim(),
                phone: values.phone.trim(),
                address: values.address.trim(),
            });
        } catch (err) {
            console.error('Save error:', err);
            if (mounted.current) setFormError(`Could not save this ${noun}. Please try again.`);
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    const handleConfirmDelete = async () => {
        setBusy(true);
        setFormError(null);
        try {
            await onDelete();
        } catch (err) {
            console.error('Delete error:', err);
            if (mounted.current) {
                setFormError(`Could not delete this ${noun}. Please try again.`);
                setConfirmingDelete(false);
            }
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    const handleLookup = async () => {
        if (!lookupCustomer) return;
        const uuid = lookupUuid.trim();
        if (!uuid) {
            setLookupError('Enter a customer UUID first.');
            return;
        }
        setLookupBusy(true);
        setLookupError(null);
        const found = await lookupCustomer(uuid);
        if (!mounted.current) return;
        setLookupBusy(false);
        if (found) {
            setValues(found);
            setErrors({});
        } else {
            setLookupError(`No customer found with UUID "${uuid}".`);
        }
    };

    const saveColor = isEdit ? 'bg-blue-700 hover:bg-blue-800' : 'bg-green-700 hover:bg-green-800';

    return (
        <Dialog title={title} variant={variant} onClose={onClose}>
            {() => (
                <>
                    {lookupCustomer && (
                        <div className="mb-6 space-y-4">
                            <div>
                                <label htmlFor="lookup-uuid" className="sr-only">Customer UUID</label>
                                <input
                                    id="lookup-uuid"
                                    className={INPUT}
                                    type="text"
                                    placeholder="Enter UUID to search"
                                    value={lookupUuid}
                                    onChange={(e) => { setLookupUuid(e.target.value); setLookupError(null); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
                                    aria-invalid={!!lookupError}
                                    aria-describedby={lookupError ? 'lookup-error' : undefined}
                                />
                                {lookupError && <ErrorText id="lookup-error">{lookupError}</ErrorText>}
                            </div>
                            <button
                                type="button"
                                onClick={handleLookup}
                                disabled={lookupBusy}
                                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-4 py-2 rounded-md"
                            >
                                {lookupBusy ? 'Fetching…' : 'Fetch Customer'}
                            </button>
                        </div>
                    )}
                    <form className="mb-6 space-y-4" noValidate onSubmit={handleSubmit}>
                        {FIELDS.map((f, i) => {
                            const id = `entry-${f.name}`;
                            const err = errors[f.name];
                            return (
                                <div key={f.name}>
                                    <label htmlFor={id} className="sr-only">{f.label}{f.required ? ' (required)' : ''}</label>
                                    <input
                                        id={id}
                                        className={INPUT}
                                        type={f.type}
                                        name={f.name}
                                        autoComplete={f.autoComplete}
                                        value={values[f.name]}
                                        onChange={handleChange}
                                        placeholder={f.required ? `${f.label} *` : f.label}
                                        required={f.required}
                                        aria-invalid={!!err}
                                        aria-describedby={err ? `${id}-error` : undefined}
                                        data-autofocus={i === 0 && !lookupCustomer ? '' : undefined}
                                    />
                                    {err && <ErrorText id={`${id}-error`}>{err}</ErrorText>}
                                </div>
                            );
                        })}

                        {formError && (
                            <p role="alert" className="text-sm text-red-700 bg-red-50 rounded px-2 py-1">{formError}</p>
                        )}

                        {confirmingDelete ? (
                            <div role="alertdialog" aria-label={`Confirm delete ${noun}`} className="rounded border border-red-300 bg-red-50 p-3 text-red-900">
                                <p className="mb-3">Delete this {noun}? This cannot be undone.</p>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={busy}
                                    className="bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white px-4 py-2 rounded-md mr-2"
                                >
                                    Yes, delete
                                </button>
                                <button
                                    type="button"
                                    ref={keepRef}
                                    onClick={() => setConfirmingDelete(false)}
                                    disabled={busy}
                                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
                                >
                                    Keep it
                                </button>
                            </div>
                        ) : (
                            <>
                                <button type="submit" disabled={busy} className={`${saveColor} disabled:opacity-60 text-white px-4 py-2 rounded-md mr-2`}>
                                    {busy ? 'Saving…' : isEdit ? 'Update' : 'Add'}
                                </button>
                                {isEdit ? (
                                    <button
                                        type="button"
                                        className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md"
                                        onClick={() => setConfirmingDelete(true)}
                                    >
                                        Delete
                                    </button>
                                ) : (
                                    <button type="button" onClick={onClose} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md">
                                        Cancel
                                    </button>
                                )}
                            </>
                        )}
                    </form>
                </>
            )}
        </Dialog>
    );
};

export default EntryDialog;
