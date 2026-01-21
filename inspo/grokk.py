import jax
import jax.numpy as jnp
from jax import grad, jit, vmap
import optax
import haiku as hk

import numpy as np
import jax.numpy as jnp
from typing import Iterable, Iterator, NamedTuple, TypeVar, Any, MutableMapping, Tuple
import time
import math
import datetime
import json
import os

from jax import config
config.update("jax_enable_x64", True)
config.update('jax_default_matmul_precision', 'float32')
np.set_printoptions(precision=3, suppress=True)

import plotly.graph_objs as go
import plotly.io as pio
import plotly.express as px
pio.renderers.default = 'colab'

import plotly.graph_objs as go
from plotly.subplots import make_subplots

def plot_training(all_metrics):
  fig = make_subplots(rows=2, cols=2, subplot_titles=("Loss", "Accuracy", "L1 Norm", "L2 Norm"), vertical_spacing=0.1)

  color_dict = {'train': 'red', 'eval': 'blue'}
  for i, metric in enumerate(['loss', 'acc']):
    for t in ['train', 'eval']:
      trace = go.Scatter(
        x=[d['step'] for d in all_metrics],
        y=[d[f'{t}_{metric}'] for d in all_metrics],
        mode='lines+markers',
        name=f'{t.capitalize()} {metric.capitalize()}',
        line=dict(color=color_dict[t]),
        yaxis='y1' if metric == 'loss' else 'y2'
      )
      fig.add_trace(trace, row=1, col=i+1)
      if metric == 'loss':
        fig.update_yaxes(type='log', title_text=f'{metric.capitalize()}', row=1, col=i+1)
      else:
        fig.update_yaxes(title_text=f'{metric.capitalize()}', row=1, col=i+1)

  # Plotting L1 and L2 norms
  for i, norm in enumerate(['l1_norm', 'l2_norm']):
    trace = go.Scatter(
      x=[d['step'] for d in all_metrics],
      y=[d[norm] for d in all_metrics],
      mode='lines+markers',
      name=norm.replace('_', ' ').capitalize()
    )
    fig.add_trace(trace, row=2, col=i+1)
    fig.update_yaxes(title_text=norm.replace('_', ' ').capitalize(), row=2, col=i+1)

  fig.update_xaxes(row=1, col=1, range=[0, max([d['step'] for d in all_metrics])])
  fig.update_xaxes(row=1, col=2, range=[0, max([d['step'] for d in all_metrics])])
  fig.update_xaxes(row=2, col=1, range=[0, max([d['step'] for d in all_metrics])])
  fig.update_xaxes(row=2, col=2, range=[0, max([d['step'] for d in all_metrics])])

  fig.update_layout(height=800, hovermode='closest')
  fig.show()

def plot_weights(state):
  key_subkey_array = []
  for key, subdict in state.params.items():
    for subkey, array in subdict.items():
      key_subkey_array.append((key, subkey, array))

  zmin = min([np.min(array) for key, subkey, array in key_subkey_array]).item()
  zmax = max([np.max(array) for key, subkey, array in key_subkey_array]).item()
  zval = max(abs(zmin), zmax)*1

  N = len(key_subkey_array)
  grid_size = math.ceil(math.sqrt(N)) # find the nearest square grid

  fig = make_subplots(rows=grid_size, cols=grid_size, subplot_titles=[f"{key} {subkey}" for key, subkey, array in key_subkey_array], vertical_spacing=.1)

  for idx, (key, subkey, array) in enumerate(key_subkey_array):
      row = idx // grid_size + 1  # Calculate the appropriate row, col placement in grid
      col = idx % grid_size + 1
      trace = go.Heatmap(z=array, zmin=zval*-1, zmax=zval*1, zmid=0, colorscale='RdBu', name=f'{key} {subkey}')
      # trace = go.Heatmap(z=array, zmin=zval*-0.1, zmax=zval*0.1, zmid=0, colorscale='RdBu', name=f'{key} {subkey}')
      fig.add_trace(trace, row=row, col=col)

  fig.update_layout(height=400*grid_size, width=400*grid_size)
  fig.show()
##
class TrainingState(NamedTuple):
  """Container for the training state."""
  params: hk.Params
  opt_state: optax.OptState
  rng: jax.Array
  step: jax.Array
##
class NpEncoder(json.JSONEncoder):
  """Save NP as json."""

  def default(self, o):
    if isinstance(o, np.integer):
      return int(o)
    if isinstance(o, np.floating):
      return float(o)
    if isinstance(o, np.ndarray):
      return o.tolist()

    if isinstance(o, jnp.integer):
      return int(o)
    if isinstance(o, jnp.floating):
      return float(o)
    if isinstance(o, jnp.ndarray):
      return o.tolist()

    return super(NpEncoder, self).default(o)
## Hyperparameters
# config for the main model used in the post
hyper = {
  'task': 'modular_addition',
  'sweep_slug': 'fail-memorize-generalize',

  'n_tokens': 67,
  'percent_train': .4,

  'embed_size': int(500),
  'hidden_size': int(24),

  'weight_decay': 1,
  'learning_rate': 1e-3,

  'max_steps': 50000,
  'seed': 165,

  # Fixed outside of sweeps
  'is_symmetric_input': True, # if True, it only takes half of the pairs (upper triangle)
  'embed_config': 'tied', # ['untied', 'tied', 'input_tied'],
  'is_collapsed_out': False,
  'is_collapsed_hidden': False,
  'is_tied_hidden': True,
  'regularization': 'l2', # ['l1', 'l2'],
  'b1': .9,
  'b2': .98,
}

# Model Creation
hyper['log_every'] = int(hyper['max_steps']/500)
hyper['save_every'] = int(hyper['max_steps']/100)
np.random.seed(hyper['seed'])

nums = list(range(hyper['n_tokens']))
if (hyper['is_symmetric_input']):
  inputs  = np.array([[a, b] for a in nums for b in nums if a <= b]).astype(np.int32)
else:
  inputs  = np.array([[a, b] for a in nums for b in nums]).astype(np.int32)
outputs = (inputs[:, 0] + inputs[:, 1]) % hyper['n_tokens']

indices = np.random.permutation(len(inputs))
split_idx = int(hyper['percent_train']*len(inputs))
train_batch = inputs[indices[:split_idx]], outputs[indices[:split_idx]]
eval_batch = inputs[indices[split_idx:]], outputs[indices[split_idx:]]

def forward(inputs):
  embed_init = hk.initializers.VarianceScaling(2)

  # calculate input embeddings
  if hyper['embed_config'] == 'untied':
    embed_a = hk.get_parameter('embed_a', [hyper['n_tokens'], hyper['embed_size']], init=embed_init)
    embed_b = hk.get_parameter('embed_b', [hyper['n_tokens'], hyper['embed_size']], init=embed_init)
  elif hyper['embed_config'] in ['tied', 'input_tied']:
    embed = hk.get_parameter('embed', [hyper['n_tokens'], hyper['embed_size']], init=embed_init)
    embed_a = embed
    embed_b = embed

  embedded_a = jnp.dot(jax.nn.one_hot(inputs[:, 0], hyper['n_tokens']), embed_a)
  embedded_b = jnp.dot(jax.nn.one_hot(inputs[:, 1], hyper['n_tokens']), embed_b)

  # calculate hidden_activations
  if hyper['is_collapsed_hidden']:
    hidden_a = embedded_a
    hidden_b = embedded_b
  else:
    if hyper['is_tied_hidden']:
      hidden_func = hk.Linear(hyper['hidden_size'], name='hidden', with_bias=False)
      hidden_a = hidden_func(embedded_a)
      hidden_b = hidden_func(embedded_b)
    else:
      hidden_a = hk.Linear(hyper['hidden_size'], name='hidden_a', with_bias=False)(embedded_a)
      hidden_b = hk.Linear(hyper['hidden_size'], name='hidden_b', with_bias=False)(embedded_b)

  hidden_activations = jax.nn.relu(hidden_a + hidden_b)

  # calculate logits
  if hyper['is_collapsed_out']:
    if hyper['embed_config'] == 'tied' and hyper['embed_size'] == hyper['hidden_size']:
      logits = jnp.matmul(hidden_activations, jnp.transpose(embed))
    else:
      logits = hk.Linear(hyper['n_tokens'], name='unembed', with_bias=False)(hidden_activations)
  else:
    out = hk.Linear(hyper['embed_size'], name='out', with_bias=False)(hidden_activations)

    if hyper['embed_config'] in ['untied', 'input_tied']:
      unembed = hk.get_parameter('unembed', [hyper['embed_size'], hyper['n_tokens']], init=embed_init)
    elif hyper['embed_config'] == 'tied':
      unembed = jnp.transpose(embed)

    logits = jnp.matmul(out, unembed)

  return {'logits': logits}

##

def l1_regularizer(weight_decay):
  def init_fn(state):
    return state
  def update_fn(updates, state, params=None):
    updates = jax.tree_map(
        lambda g, p: g + weight_decay * jnp.sign(p), updates, params
    )
    return updates, state
  return optax.GradientTransformation(init_fn, update_fn)

if hyper['regularization'] == 'l1':
  optimiser = optax.chain(
    l1_regularizer(hyper['weight_decay']),
    optax.adam(hyper['learning_rate'], b1=hyper['b1'], b2=hyper['b2']),
  )
elif hyper['regularization'] == 'l2':
  optimiser = optax.adamw(learning_rate=hyper['learning_rate'], weight_decay=hyper['weight_decay'], b1=hyper['b1'], b2=hyper['b2'],)

@hk.transform
def acc_fn(batch):
  inputs, targets = batch
  outputs = forward(inputs)
  predictions = jnp.argmax(outputs['logits'], axis=1)
  return jnp.mean(jnp.equal(predictions, targets))

@hk.transform
def loss_fn(batch):
  inputs, targets = batch

  logits = forward(inputs)['logits']
  log_probs = jax.nn.log_softmax(logits, axis=-1)
  targets = jax.nn.one_hot(targets, hyper['n_tokens'])

  return -jnp.mean(targets*log_probs)
  # l1_penalty = hyper['weight_decay_l1']*sum(jnp.sum(jnp.abs(p)) for p in jax.tree_leaves(params))

@jax.jit
def update(state, batch):
  rng, new_rng = jax.random.split(state.rng)
  loss_and_grad_fn = jax.value_and_grad(loss_fn.apply)
  loss, gradients = loss_and_grad_fn(state.params, rng, batch)

  updates, new_opt_state = optimiser.update(gradients, state.opt_state, state.params)
  new_params = optax.apply_updates(state.params, updates)

  new_state = TrainingState(
    params=new_params,
    opt_state=new_opt_state,
    rng=new_rng,
    step=state.step + 1,
  )
  metrics = {'step': state.step, 'train_loss': loss}

  return new_state, metrics

@jax.jit
def init(rng, batch):
  rng, init_rng = jax.random.split(rng)
  initial_params = loss_fn.init(init_rng, batch)
  return TrainingState(
    params=initial_params,
    opt_state=optimiser.init(initial_params),
    rng=rng,
    step=np.array(0),
  )

# initialise model parameters
state = init(jax.random.PRNGKey(hyper['seed']), train_batch)

all_metrics = []
saved_checkpoints = []
prev_time = time.time()

# Training

for step in range(hyper['max_steps'] + 1):
  if 'batch_size' in train_batch:
    indices = np.random.choice(len(train_batch[0]), size=hyper['batch_size'], replace=False)
    train_batch_tmp = train_batch[0][indices], train_batch[1][indices]
  else:
    train_batch_tmp = train_batch

  state, metrics = update(state, train_batch)
  if step % hyper['save_every'] == 0:
    saved_checkpoints.append({'step': step, 'state': state})
  if step % hyper['log_every'] == 0:
    steps_per_sec = hyper['log_every'] / (time.time() - prev_time)
    prev_time = time.time()

    l1_norm = 0
    l2_norm = 0
    for param in jax.tree_util.tree_leaves(state.params):
      l1_norm += jnp.sum(jnp.abs(param))
      l2_norm += jnp.sum(jnp.square(param))
    l2_norm = jnp.sqrt(l2_norm)

    metrics |= {
      'eval_loss': loss_fn.apply(state.params, state.rng, eval_batch),
      'train_acc': acc_fn.apply(state.params, state.rng, train_batch),
      'eval_acc': acc_fn.apply(state.params, state.rng, eval_batch),
      'l1_norm': l1_norm,
      'l2_norm': l2_norm,
      'steps_per_sec': steps_per_sec,
    }
    all_metrics.append(metrics)

    print({k: (v.item() if hasattr(v, 'item') else v) for k, v in metrics.items()})

# DFT
# https://colab.research.google.com/drive/1F6_1_cWXE5M7WocUcpQWp3v8z4b1jL20#scrollTo=iSPxi3ElsujY

p = hyper['n_tokens']
fourier_basis = []
fourier_basis.append(np.ones(p) / np.sqrt(p))
fourier_basis_names = ['Const']

# If p is even, we need to explicitly add a term for cos(kpi), ie alternating +1 and -1
for i in range(1, p // 2 + 1):
    fourier_basis.append(np.cos(2 * np.pi * np.arange(p) * i / p))
    fourier_basis.append(np.sin(2 * np.pi * np.arange(p) * i / p))
    fourier_basis[-2] /= np.linalg.norm(fourier_basis[-2])
    fourier_basis[-1] /= np.linalg.norm(fourier_basis[-1])
    fourier_basis_names.append(f'cos {i}')
    fourier_basis_names.append(f'sin {i}')

fourier_basis = jnp.stack(fourier_basis, axis=0)

## Save web model

def save_model(hyper, all_metrics, saved_checkpoints, train_batch):
  sweep_str = datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
  ckpt_dir = workdir + 'sweeps/' + hyper['sweep_slug'] + '/' + sweep_str + '/'

  os.makedirs(os.path.dirname(ckpt_dir))

  with open(os.path.join(ckpt_dir, 'hyper.json'), 'w') as f:
    f.write(json.dumps(hyper))

  with open(os.path.join(ckpt_dir, 'metrics.json'), 'w') as f:
    f.write(json.dumps(all_metrics, cls=NpEncoder))

  with open(os.path.join(ckpt_dir, 'train_batch.npy'), 'wb') as f:
    np.save(f, train_batch[0])

  key_subkey_array = []
  for key, subdict in saved_checkpoints[0]['state'].params.items():
    for subkey, array in subdict.items():
      key_subkey_array.append((key, subkey))

  for key, subkey in key_subkey_array:
    slug = (key + '_' +subkey).replace('~', '')
    array = [d['state'].params[key][subkey] for d in saved_checkpoints]
    with open(os.path.join(ckpt_dir, f'{slug}.npy'), 'wb') as f:
      np.save(f, np.asarray(array).astype(np.float32))

  return ckpt_dir