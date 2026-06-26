
export type StatusType = 'Created' | 'InTransit' | 'Delivered' | 'Failed';

export default function StatusBadge({ status}: {status: StatusType }) {
    const styles = {
        Created: 'bg-amber-100 text-amber-800 border-amber-300',
        InTransit: 'bg-blue-100 text-blue-800 border-blue-300',
        Delivered: 'bg-green-100 text-green-800 border-green-300',
        Failed: 'bg-red-100 text-red-800 border-red-300'
    };
    return(
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
            {status === 'InTransit' ? 'In Transit' : status}
        </span>
    );

}