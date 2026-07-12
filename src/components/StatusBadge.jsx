import React from 'react';

/**
 * StatusBadge component displays the status of an asset with specific color coding.
 * 
 * @param {Object} props
 * @param {string} props.status - The current status of the asset.
 */
export default function StatusBadge({ status }) {
  let classes = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ";

  switch (status) {
    case 'Available':
      classes += "bg-asset-green/10 text-emerald-400 border-asset-green/30";
      break;
    case 'Allocated':
      classes += "bg-sky-500/10 text-sky-400 border-sky-500/30";
      break;
    case 'Reserved':
      classes += "bg-amber-500/10 text-amber-400 border-amber-500/30";
      break;
    case 'Under Maintenance':
      classes += "bg-orange-500/10 text-orange-400 border-orange-500/30";
      break;
    case 'Lost':
      classes += "bg-red-500/10 text-red-400 border-red-500/30";
      break;
    case 'Retired':
      classes += "bg-stone-500/10 text-stone-400 border-stone-500/30";
      break;
    case 'Disposed':
      classes += "bg-stone-900/40 text-stone-500 border-stone-800";
      break;
    default:
      classes += "bg-stone-900 text-stone-400 border-stone-800";
  }

  return (
    <span className={classes}>
      {status}
    </span>
  );
}
