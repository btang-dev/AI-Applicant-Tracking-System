const ScoreBadge = ({ score }: { score: number }) => {
    const badgeStyle = score > 70
        ? 'bg-badge-green text-green-600'
        : score > 49
            ? 'bg-badge-yellow text-yellow-600'
            : 'bg-badge-red text-red-600';
    const label = score > 70
        ? 'Strong'
        : score > 49
            ? 'Good Start'
            : 'Needs work';

    return (
        <div className={`score-badge ${badgeStyle}`}>
            <p>{label}</p>
        </div>
    )
}

export default ScoreBadge
