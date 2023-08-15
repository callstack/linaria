import { PriorityQueue } from '../PriorityQueue';
import { rootLog } from '../rootLog';

class NumberQueue extends PriorityQueue<number> {
  constructor() {
    super(
      rootLog,
      (i) => i.toString(),
      (a, b) => a < b
    );
  }

  public delete(item: string) {
    super.delete(item);
  }

  public dequeue() {
    return super.dequeue();
  }

  public enqueue(item: number) {
    super.enqueue(item);
  }

  public dump() {
    const result = [];
    while (!this.isEmpty()) {
      result.push(this.dequeue());
    }

    return result;
  }
}

describe('PriorityQueue', () => {
  it('should be defined', () => {
    expect(PriorityQueue).toBeDefined();
  });

  describe('Simple queue of numbers', () => {
    describe('emptiness', () => {
      it('should be empty', () => {
        const queue = new NumberQueue();
        expect(queue.isEmpty()).toBe(true);
      });

      it('should not be empty', () => {
        const queue = new NumberQueue();
        queue.enqueue(1);
        expect(queue.isEmpty()).toBe(false);
      });

      it('should be empty after dequeue', () => {
        const queue = new NumberQueue();
        queue.enqueue(1);
        queue.dequeue();
        expect(queue.isEmpty()).toBe(true);
      });
    });

    it('should dequeue in order', () => {
      const queue = new NumberQueue();
      [2, 1, 3].forEach((i) => queue.enqueue(i));
      expect(queue.dump()).toEqual([3, 2, 1]);
    });

    it('should dequeue in order after delete', () => {
      const queue = new NumberQueue();
      [2, 1, 4, 3, 5].forEach((i) => queue.enqueue(i));
      queue.delete('3');
      expect(queue.dump()).toEqual([5, 4, 2, 1]);
    });
  });
});
