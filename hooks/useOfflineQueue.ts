import { useRef } from 'react';

interface QueuedAction {
	run: () => Promise<void>;
}

export function useOfflineQueue() {
	const queue = useRef<QueuedAction[]>([]);

	const enqueue = (action: () => Promise<void>) => {
		queue.current.push({ run: action });
	};

	const flush = async () => {
		while (queue.current.length > 0) {
			const next = queue.current.shift();
			if (next) await next.run();
		}
	};

	return { enqueue, flush };
}
