import { useState, useCallback, useMemo } from 'react';
import type { PredictionInput, PredictionType, Fixture } from '@/types';
import { PREDICTION_POINTS } from '@/types';

interface PredictionState {
  value: string;
  confidence: number;
}

interface PredictionBuilderReturn {
  predictions: PredictionInput[];
  totalPredictions: number;
  potentialPoints: number;
  maxPossiblePoints: number;
  setPrediction: (fixtureId: string, type: PredictionType, value: string) => void;
  setConfidence: (fixtureId: string, type: PredictionType, confidence: number) => void;
  removePrediction: (fixtureId: string, type: PredictionType) => void;
  clearFixture: (fixtureId: string) => void;
  clearAll: () => void;
  getPrediction: (fixtureId: string, type: PredictionType) => string | null;
  getConfidence: (fixtureId: string, type: PredictionType) => number;
  getFixturePredictionCount: (fixtureId: string) => number;
  isValid: boolean;
  validationErrors: string[];
}

export function usePredictionBuilder(fixtures: Fixture[]): PredictionBuilderReturn {
  const [predictionMap, setPredictionMap] = useState<Map<string, PredictionState>>(new Map());

  const makeKey = (fixtureId: string, type: PredictionType) => `${fixtureId}:${type}`;

  const setPrediction = useCallback(
    (fixtureId: string, type: PredictionType, value: string) => {
      setPredictionMap((prev) => {
        const next = new Map(prev);
        const key = makeKey(fixtureId, type);
        const existing = prev.get(key);
        next.set(key, { value, confidence: existing?.confidence ?? 1 });
        return next;
      });
    },
    [],
  );

  const setConfidence = useCallback(
    (fixtureId: string, type: PredictionType, confidence: number) => {
      setPredictionMap((prev) => {
        const next = new Map(prev);
        const key = makeKey(fixtureId, type);
        const existing = prev.get(key);
        if (existing) {
          next.set(key, { ...existing, confidence });
        }
        return next;
      });
    },
    [],
  );

  const removePrediction = useCallback(
    (fixtureId: string, type: PredictionType) => {
      setPredictionMap((prev) => {
        const next = new Map(prev);
        next.delete(makeKey(fixtureId, type));
        return next;
      });
    },
    [],
  );

  const clearFixture = useCallback(
    (fixtureId: string) => {
      setPredictionMap((prev) => {
        const next = new Map(prev);
        for (const key of prev.keys()) {
          if (key.startsWith(`${fixtureId}:`)) next.delete(key);
        }
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    setPredictionMap(new Map());
  }, []);

  const getPrediction = useCallback(
    (fixtureId: string, type: PredictionType): string | null => {
      return predictionMap.get(makeKey(fixtureId, type))?.value ?? null;
    },
    [predictionMap],
  );

  const getConfidence = useCallback(
    (fixtureId: string, type: PredictionType): number => {
      return predictionMap.get(makeKey(fixtureId, type))?.confidence ?? 1;
    },
    [predictionMap],
  );

  const getFixturePredictionCount = useCallback(
    (fixtureId: string): number => {
      let count = 0;
      for (const key of predictionMap.keys()) {
        if (key.startsWith(`${fixtureId}:`)) count++;
      }
      return count;
    },
    [predictionMap],
  );

  const predictions = useMemo((): PredictionInput[] => {
    const result: PredictionInput[] = [];
    for (const [key, state] of predictionMap) {
      const [fixtureId, predictionType] = key.split(':') as [string, PredictionType];
      result.push({
        fixtureId,
        predictionType,
        predictedValue: state.value,
        confidence: state.confidence,
      });
    }
    return result;
  }, [predictionMap]);

  const totalPredictions = predictions.length;

  const potentialPoints = useMemo(() => {
    return predictions.reduce(
      (sum, p) => sum + PREDICTION_POINTS[p.predictionType] * p.confidence,
      0,
    );
  }, [predictions]);

  const maxPossiblePoints = useMemo(() => {
    const upcomingFixtures = fixtures.filter((f) => f.status === 'NS');
    return upcomingFixtures.length * 12 * 3;
  }, [fixtures]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (predictions.length === 0) {
      errors.push('Make at least one prediction');
    }
    for (const p of predictions) {
      const fixture = fixtures.find((f) => f.id === p.fixtureId);
      if (fixture && fixture.status !== 'NS') {
        errors.push(`${fixture.homeTeamName} vs ${fixture.awayTeamName} has already started`);
      }
    }
    return errors;
  }, [predictions, fixtures]);

  const isValid = validationErrors.length === 0 && predictions.length > 0;

  return {
    predictions,
    totalPredictions,
    potentialPoints,
    maxPossiblePoints,
    setPrediction,
    setConfidence,
    removePrediction,
    clearFixture,
    clearAll,
    getPrediction,
    getConfidence,
    getFixturePredictionCount,
    isValid,
    validationErrors,
  };
}